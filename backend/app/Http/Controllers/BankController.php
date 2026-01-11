<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class BankController extends Controller
{
    /**
     * Get list of Nigerian banks from Paystack
     */
    public function index()
    {
        // Cache banks for 24 hours to avoid hitting API too often
        $banks = Cache::remember('nigerian_banks', 86400, function () {
            try {
                $response = Http::get('https://api.paystack.co/bank');
                
                if ($response->successful()) {
                    $data = $response->json();
                    return collect($data['data'] ?? [])
                        ->sortBy('name')
                        ->values()
                        ->map(fn($bank) => [
                            'name' => $bank['name'],
                            'code' => $bank['code'],
                            'slug' => $bank['slug'] ?? null,
                        ])
                        ->toArray();
                }
                
                return $this->getFallbackBanks();
            } catch (\Exception $e) {
                return $this->getFallbackBanks();
            }
        });

        return response()->json([
            'success' => true,
            'banks' => $banks,
        ]);
    }

    /**
     * Fallback banks in case API fails
     */
    private function getFallbackBanks()
    {
        return [
            ['name' => 'Access Bank', 'code' => '044'],
            ['name' => 'Citibank Nigeria', 'code' => '023'],
            ['name' => 'Ecobank Nigeria', 'code' => '050'],
            ['name' => 'Fidelity Bank', 'code' => '070'],
            ['name' => 'First Bank of Nigeria', 'code' => '011'],
            ['name' => 'First City Monument Bank', 'code' => '214'],
            ['name' => 'Guaranty Trust Bank', 'code' => '058'],
            ['name' => 'Heritage Bank', 'code' => '030'],
            ['name' => 'Keystone Bank', 'code' => '082'],
            ['name' => 'Polaris Bank', 'code' => '076'],
            ['name' => 'Stanbic IBTC Bank', 'code' => '221'],
            ['name' => 'Standard Chartered Bank', 'code' => '068'],
            ['name' => 'Sterling Bank', 'code' => '232'],
            ['name' => 'Union Bank of Nigeria', 'code' => '032'],
            ['name' => 'United Bank for Africa', 'code' => '033'],
            ['name' => 'Unity Bank', 'code' => '215'],
            ['name' => 'Wema Bank', 'code' => '035'],
            ['name' => 'Zenith Bank', 'code' => '057'],
            ['name' => 'Kuda Bank', 'code' => '50211'],
            ['name' => 'OPay', 'code' => '999992'],
            ['name' => 'PalmPay', 'code' => '999991'],
            ['name' => 'Moniepoint', 'code' => '50515'],
        ];
    }

    /**
     * Resolve/verify account number and get account name
     */
    public function resolveAccount(Request $request)
    {
        $request->validate([
            'account_number' => 'required|string|size:10',
            'bank_code' => 'required|string',
        ]);

        $secretKey = config('services.paystack.secret_key') ?? env('PAYSTACK_SECRET_KEY');
        
        if (!$secretKey) {
            return response()->json([
                'success' => false,
                'message' => 'Payment gateway not configured',
            ], 500);
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $secretKey,
            ])->get('https://api.paystack.co/bank/resolve', [
                'account_number' => $request->account_number,
                'bank_code' => $request->bank_code,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return response()->json([
                    'success' => true,
                    'account_name' => $data['data']['account_name'] ?? null,
                    'account_number' => $data['data']['account_number'] ?? $request->account_number,
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Could not verify account. Please check the details.',
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Account verification failed. Please try again.',
            ], 500);
        }
    }
}
