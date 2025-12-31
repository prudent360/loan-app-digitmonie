<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\VirtualCard;
use App\Services\FlutterwaveService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class VirtualCardController extends Controller
{
    protected $flutterwave;

    public function __construct(FlutterwaveService $flutterwave)
    {
        $this->flutterwave = $flutterwave;
    }

    /**
     * Get all virtual cards for the authenticated user
     */
    public function index()
    {
        $cards = VirtualCard::forUser(Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'cards' => $cards,
        ]);
    }

    /**
     * Create a new virtual card
     */
    public function store(Request $request)
    {
        $request->validate([
            'currency' => 'required|in:USD,NGN',
            'amount' => 'required|numeric|min:5',
            'billing_address' => 'required|string',
            'billing_city' => 'required|string',
            'billing_state' => 'required|string',
            'billing_postal_code' => 'required|string',
            'date_of_birth' => 'required|date',
            'title' => 'sometimes|in:Mr,Mrs,Miss,Ms',
            'gender' => 'sometimes|in:M,F',
        ]);

        $user = Auth::user();

        try {
            $response = $this->flutterwave->createVirtualCard([
                'currency' => $request->currency,
                'amount' => $request->amount,
                'billing_name' => $user->name,
                'billing_address' => $request->billing_address,
                'billing_city' => $request->billing_city,
                'billing_state' => $request->billing_state,
                'billing_postal_code' => $request->billing_postal_code,
                'billing_country' => 'NG',
                'first_name' => explode(' ', $user->name)[0],
                'last_name' => explode(' ', $user->name)[1] ?? '',
                'date_of_birth' => $request->date_of_birth,
                'email' => $user->email,
                'phone' => $user->phone,
                'title' => $request->title ?? 'Mr',
                'gender' => $request->gender ?? 'M',
            ]);

            if ($response['status'] !== 'success') {
                return response()->json([
                    'success' => false,
                    'message' => $response['message'] ?? 'Failed to create virtual card',
                ], 400);
            }

            $cardData = $response['data'];

            $card = VirtualCard::create([
                'user_id' => $user->id,
                'flw_card_id' => $cardData['id'],
                'card_pan' => substr($cardData['card_pan'] ?? '', -4),
                'masked_pan' => $cardData['masked_pan'] ?? null,
                'currency' => $cardData['currency'] ?? $request->currency,
                'balance' => $cardData['balance'] ?? $request->amount,
                'card_type' => 'virtual',
                'status' => 'active',
                'name_on_card' => $cardData['name_on_card'] ?? $user->name,
                'expiry_date' => $cardData['expiry'] ?? null,
                'billing_address' => [
                    'address' => $request->billing_address,
                    'city' => $request->billing_city,
                    'state' => $request->billing_state,
                    'postal_code' => $request->billing_postal_code,
                    'country' => 'NG',
                ],
                'last_funded_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Virtual card created successfully',
                'card' => $card,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Virtual card creation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create virtual card. Please try again.',
            ], 500);
        }
    }

    /**
     * Get a specific virtual card with transactions
     */
    public function show($id)
    {
        $card = VirtualCard::forUser(Auth::id())->findOrFail($id);

        // Fetch latest transactions from Flutterwave
        $transactions = [];
        try {
            $response = $this->flutterwave->getCardTransactions($card->flw_card_id);
            if ($response['status'] === 'success') {
                $transactions = $response['data'] ?? [];
            }

            // Also refresh the card balance
            $cardResponse = $this->flutterwave->getVirtualCard($card->flw_card_id);
            if ($cardResponse['status'] === 'success') {
                $card->update([
                    'balance' => $cardResponse['data']['balance'] ?? $card->balance,
                    'status' => $cardResponse['data']['is_active'] ? 'active' : 'blocked',
                ]);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to fetch card transactions: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'card' => $card->fresh(),
            'transactions' => $transactions,
        ]);
    }

    /**
     * Fund a virtual card
     */
    public function fund(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        $card = VirtualCard::forUser(Auth::id())->findOrFail($id);

        if (!$card->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Card is not active. Please unblock or reactivate the card.',
            ], 400);
        }

        try {
            $response = $this->flutterwave->fundVirtualCard(
                $card->flw_card_id,
                $request->amount
            );

            if ($response['status'] !== 'success') {
                return response()->json([
                    'success' => false,
                    'message' => $response['message'] ?? 'Failed to fund card',
                ], 400);
            }

            // Update local balance
            $card->update([
                'balance' => $card->balance + $request->amount,
                'last_funded_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Card funded successfully',
                'card' => $card->fresh(),
            ]);

        } catch (\Exception $e) {
            Log::error('Card funding failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fund card. Please try again.',
            ], 500);
        }
    }

    /**
     * Withdraw from a virtual card
     */
    public function withdraw(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        $card = VirtualCard::forUser(Auth::id())->findOrFail($id);

        if (!$card->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Card is not active.',
            ], 400);
        }

        if ($request->amount > $card->balance) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient card balance.',
            ], 400);
        }

        try {
            $response = $this->flutterwave->withdrawFromCard(
                $card->flw_card_id,
                $request->amount
            );

            if ($response['status'] !== 'success') {
                return response()->json([
                    'success' => false,
                    'message' => $response['message'] ?? 'Failed to withdraw from card',
                ], 400);
            }

            // Update local balance
            $card->update([
                'balance' => $card->balance - $request->amount,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal successful',
                'card' => $card->fresh(),
            ]);

        } catch (\Exception $e) {
            Log::error('Card withdrawal failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to withdraw. Please try again.',
            ], 500);
        }
    }

    /**
     * Block or unblock a virtual card
     */
    public function toggleBlock(Request $request, $id)
    {
        $request->validate([
            'action' => 'required|in:block,unblock',
        ]);

        $card = VirtualCard::forUser(Auth::id())->findOrFail($id);

        if ($card->isTerminated()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot modify a terminated card.',
            ], 400);
        }

        try {
            if ($request->action === 'block') {
                $response = $this->flutterwave->blockCard($card->flw_card_id);
                $newStatus = 'blocked';
            } else {
                $response = $this->flutterwave->unblockCard($card->flw_card_id);
                $newStatus = 'active';
            }

            if ($response['status'] !== 'success') {
                return response()->json([
                    'success' => false,
                    'message' => $response['message'] ?? 'Failed to update card status',
                ], 400);
            }

            $card->update(['status' => $newStatus]);

            return response()->json([
                'success' => true,
                'message' => 'Card ' . $request->action . 'ed successfully',
                'card' => $card->fresh(),
            ]);

        } catch (\Exception $e) {
            Log::error('Card status update failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update card status.',
            ], 500);
        }
    }

    /**
     * Terminate a virtual card
     */
    public function terminate($id)
    {
        $card = VirtualCard::forUser(Auth::id())->findOrFail($id);

        if ($card->isTerminated()) {
            return response()->json([
                'success' => false,
                'message' => 'Card is already terminated.',
            ], 400);
        }

        try {
            $response = $this->flutterwave->terminateCard($card->flw_card_id);

            if ($response['status'] !== 'success') {
                return response()->json([
                    'success' => false,
                    'message' => $response['message'] ?? 'Failed to terminate card',
                ], 400);
            }

            $card->update(['status' => 'terminated']);

            return response()->json([
                'success' => true,
                'message' => 'Card terminated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Card termination failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to terminate card.',
            ], 500);
        }
    }
}
