<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\SavingsPlan;
use App\Models\SavingsPlanDuration;
use App\Models\UserSaving;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Services\NotificationService;

class SavingsController extends Controller
{
    public function plans()
    {
        $plans = SavingsPlan::active()
            ->with('durations')
            ->orderBy('name')
            ->get();

        return response()->json(['plans' => $plans]);
    }

    public function index()
    {
        $savings = auth()->user()->userSavings()
            ->with(['savingsPlan', 'duration'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($saving) {
                $saving->calculated_interest = $saving->calculateInterest();
                $saving->total_balance = $saving->amount + $saving->calculated_interest;
                $saving->can_withdraw = $saving->canWithdraw();
                $saving->withdrawal_penalty = $saving->getWithdrawalPenalty();
                return $saving;
            });

        return response()->json(['savings' => $savings]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'savings_plan_id' => 'required|exists:savings_plans,id',
            'savings_plan_duration_id' => 'required|exists:savings_plan_durations,id',
            'name' => 'nullable|string|max:100',
            'amount' => 'required|numeric|min:1'
        ]);

        $plan = SavingsPlan::active()->findOrFail($request->savings_plan_id);
        $duration = SavingsPlanDuration::where('savings_plan_id', $plan->id)
            ->findOrFail($request->savings_plan_duration_id);

        // Validate amount against plan limits
        if ($request->amount < $plan->min_amount) {
            return response()->json([
                'message' => "Minimum deposit is ₦" . number_format((float)$plan->min_amount)
            ], 400);
        }

        if ($plan->max_amount && $request->amount > $plan->max_amount) {
            return response()->json([
                'message' => "Maximum deposit is ₦" . number_format((float)$plan->max_amount)
            ], 400);
        }

        // Check wallet balance
        $wallet = auth()->user()->wallet;
        if (!$wallet || $wallet->balance < $request->amount) {
            return response()->json(['message' => 'Insufficient wallet balance'], 400);
        }

        // Store balance before deduction
        $balanceBefore = $wallet->balance;

        // Deduct from wallet
        $wallet->decrement('balance', (float)$request->amount);

        // Calculate maturity date from duration
        $maturityDate = $duration->lock_period_days > 0 
            ? Carbon::now()->addDays($duration->lock_period_days) 
            : null;

        // Create user saving
        $saving = UserSaving::create([
            'user_id' => auth()->id(),
            'savings_plan_id' => $plan->id,
            'savings_plan_duration_id' => $duration->id,
            'name' => $request->name,
            'amount' => (float)$request->amount,
            'accrued_interest' => 0,
            'maturity_date' => $maturityDate,
            'status' => 'active'
        ]);

        // Log transaction
        $wallet->transactions()->create([
            'user_id' => auth()->id(),
            'reference' => 'SAV-' . uniqid(),
            'type' => 'savings_deposit',
            'amount' => $request->amount,
            'balance_before' => (float)$balanceBefore,
            'balance_after' => (float)$wallet->fresh()->balance,
            'description' => "Deposit to {$plan->name} ({$duration->lock_period_days} days)",
            'status' => 'completed'
        ]);

        $saving->load(['savingsPlan', 'duration']);

        // Send email notification
        NotificationService::sendSavingsContributionEmail($saving, (float)$request->amount);

        return response()->json([
            'message' => 'Savings created successfully',
            'saving' => $saving
        ], 201);
    }

    public function show($id)
    {
        $saving = auth()->user()->userSavings()
            ->with(['savingsPlan', 'duration'])
            ->findOrFail($id);

        $saving->calculated_interest = $saving->calculateInterest();
        $saving->total_balance = $saving->amount + $saving->calculated_interest;
        $saving->can_withdraw = $saving->canWithdraw();
        $saving->withdrawal_penalty = $saving->getWithdrawalPenalty();

        return response()->json(['saving' => $saving]);
    }

    public function withdraw($id)
    {
        $saving = auth()->user()->userSavings()
            ->with(['savingsPlan', 'duration'])
            ->where('status', 'active')
            ->findOrFail($id);

        // Check if early withdrawal is allowed
        $plan = $saving->savingsPlan;
        $canWithdrawNormally = $saving->canWithdraw();
        
        if (!$canWithdrawNormally && !$plan->allow_early_withdrawal) {
            return response()->json([
                'message' => 'Early withdrawal is not allowed for this savings plan. Please wait until the maturity date.'
            ], 400);
        }

        $interest = $saving->calculateInterest();
        $totalAmount = $saving->amount + $interest;
        $penalty = 0;

        // Apply penalty if early withdrawal
        if (!$canWithdrawNormally) {
            $penalty = $saving->getWithdrawalPenalty();
            $totalAmount -= $penalty;
        }

        // Credit wallet
        $wallet = auth()->user()->wallet;
        $balanceBefore = $wallet->balance;
        $wallet->increment('balance', (float)$totalAmount);

        // Update saving
        $saving->update([
            'status' => 'withdrawn',
            'accrued_interest' => $interest
        ]);

        // Log transaction
        $wallet->transactions()->create([
            'user_id' => auth()->id(),
            'reference' => 'SAV-' . uniqid(),
            'type' => 'savings_withdrawal',
            'amount' => $totalAmount,
            'balance_before' => (float)$balanceBefore,
            'balance_after' => (float)$wallet->fresh()->balance,
            'description' => "Withdrawal from {$saving->savingsPlan->name}" . ($penalty > 0 ? " (Penalty: ₦" . number_format($penalty) . ")" : ""),
            'status' => 'completed'
        ]);

        // Send email notification
        NotificationService::sendSavingsWithdrawalEmail($saving, (float)$totalAmount, (float)$interest);

        return response()->json([
            'message' => 'Withdrawal successful',
            'amount' => (float)$totalAmount,
            'penalty' => (float)$penalty,
            'interest' => (float)$interest
        ]);
    }

    public function addFunds(Request $request, $id)
    {
        $saving = auth()->user()->userSavings()
            ->with(['savingsPlan', 'duration'])
            ->where('status', 'active')
            ->findOrFail($id);

        // Only allow adding funds to flexible plans (duration with 0 lock days)
        if ($saving->duration && $saving->duration->lock_period_days > 0) {
            return response()->json([
                'message' => 'Cannot add funds to locked savings'
            ], 400);
        }

        $request->validate([
            'amount' => 'required|numeric|min:1'
        ]);

        // Check wallet
        $wallet = auth()->user()->wallet;
        if (!$wallet || $wallet->balance < $request->amount) {
            return response()->json(['message' => 'Insufficient wallet balance'], 400);
        }

        // Store balance before
        $balanceBefore = $wallet->balance;

        // Deduct from wallet
        $wallet->decrement('balance', (float)$request->amount);

        // Add to savings
        $saving->amount += (float)$request->amount;
        $saving->save();

        // Log transaction
        $wallet->transactions()->create([
            'user_id' => auth()->id(),
            'reference' => 'SAV-' . uniqid(),
            'type' => 'savings_deposit',
            'amount' => $request->amount,
            'balance_before' => (float)$balanceBefore,
            'balance_after' => (float)$wallet->fresh()->balance,
            'description' => "Additional deposit to {$saving->savingsPlan->name}",
            'status' => 'completed'
        ]);

        // Send email notification
        NotificationService::sendSavingsContributionEmail($saving, (float)$request->amount);

        return response()->json([
            'message' => 'Funds added successfully',
            'saving' => $saving
        ]);
    }
}
