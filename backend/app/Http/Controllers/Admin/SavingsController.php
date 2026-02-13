<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SavingsPlan;
use App\Models\SavingsPlanDuration;
use App\Models\UserSaving;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class SavingsController extends Controller
{
    public function index()
    {
        $plans = SavingsPlan::withCount('userSavings')
            ->with('durations')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['plans' => $plans]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'min_amount' => 'required|numeric|min:0',
            'max_amount' => 'nullable|numeric|min:0',
            'allow_early_withdrawal' => 'boolean',
            'durations' => 'required|array|min:1',
            'durations.*.lock_period_days' => 'required|integer|min:0',
            'durations.*.interest_rate' => 'required|numeric|min:0|max:100',
            'durations.*.early_withdrawal_penalty' => 'nullable|numeric|min:0|max:100',
        ], [
            'durations.*.interest_rate.required' => 'Interest rate is required for all durations.',
            'durations.*.lock_period_days.required' => 'Lock period is required for all durations.',
        ]);

        $plan = SavingsPlan::create([
            'name' => $request->name,
            'description' => $request->description,
            'min_amount' => (float)$request->min_amount,
            'max_amount' => $request->max_amount ? (float)$request->max_amount : null,
            'allow_early_withdrawal' => $request->allow_early_withdrawal ?? true,
        ]);

        // Create durations
        foreach ($request->durations as $duration) {
            $plan->durations()->create([
                'lock_period_days' => $duration['lock_period_days'],
                'interest_rate' => $duration['interest_rate'],
                'early_withdrawal_penalty' => $duration['early_withdrawal_penalty'] ?? 0,
            ]);
        }

        $plan->load('durations');

        return response()->json([
            'message' => 'Savings plan created successfully',
            'plan' => $plan
        ], 201);
    }

    public function show($id)
    {
        $plan = SavingsPlan::with(['durations', 'userSavings.user'])->findOrFail($id);
        
        return response()->json(['plan' => $plan]);
    }

    public function update(Request $request, $id)
    {
        $plan = SavingsPlan::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'min_amount' => 'required|numeric|min:0',
            'max_amount' => 'nullable|numeric|min:0',
            'allow_early_withdrawal' => 'boolean',
            'durations' => 'required|array|min:1',
            'durations.*.id' => 'nullable|integer',
            'durations.*.lock_period_days' => 'required|integer|min:0',
            'durations.*.interest_rate' => 'required|numeric|min:0|max:100',
            'durations.*.early_withdrawal_penalty' => 'nullable|numeric|min:0|max:100',
        ], [
            'durations.*.interest_rate.required' => 'Interest rate is required for all durations.',
            'durations.*.lock_period_days.required' => 'Lock period is required for all durations.',
        ]);

        $plan->update([
            'name' => $request->name,
            'description' => $request->description,
            'min_amount' => (float)$request->min_amount,
            'max_amount' => $request->max_amount ? (float)$request->max_amount : null,
            'allow_early_withdrawal' => $request->allow_early_withdrawal ?? true,
        ]);

        // Sync durations - update existing, create new, delete removed
        $existingIds = [];
        foreach ($request->durations as $durationData) {
            if (isset($durationData['id'])) {
                // Update existing
                $duration = SavingsPlanDuration::find($durationData['id']);
                if ($duration && $duration->savings_plan_id == $plan->id) {
                    $duration->update([
                        'lock_period_days' => $durationData['lock_period_days'],
                        'interest_rate' => $durationData['interest_rate'],
                        'early_withdrawal_penalty' => $durationData['early_withdrawal_penalty'] ?? 0,
                    ]);
                    $existingIds[] = $duration->id;
                }
            } else {
                // Create new
                $newDuration = $plan->durations()->create([
                    'lock_period_days' => $durationData['lock_period_days'],
                    'interest_rate' => $durationData['interest_rate'],
                    'early_withdrawal_penalty' => $durationData['early_withdrawal_penalty'] ?? 0,
                ]);
                $existingIds[] = $newDuration->id;
            }
        }

        // Delete durations that were removed (only if they have no active savings)
        $plan->durations()
            ->whereNotIn('id', $existingIds)
            ->whereDoesntHave('userSavings', function ($q) {
                $q->where('status', 'active');
            })
            ->delete();

        $plan->load('durations');

        return response()->json([
            'message' => 'Savings plan updated successfully',
            'plan' => $plan
        ]);
    }

    public function destroy($id)
    {
        $plan = SavingsPlan::findOrFail($id);
        
        if ($plan->userSavings()->where('status', 'active')->exists()) {
            return response()->json([
                'message' => 'Cannot delete plan with active subscriptions'
            ], 400);
        }

        $plan->delete();

        return response()->json(['message' => 'Savings plan deleted successfully']);
    }

    public function toggleStatus($id)
    {
        $plan = SavingsPlan::findOrFail($id);
        $plan->status = $plan->status === 'active' ? 'inactive' : 'active';
        $plan->save();

        return response()->json([
            'message' => 'Plan status updated',
            'plan' => $plan
        ]);
    }

    public function release($id)
    {
        $saving = UserSaving::with(['user', 'savingsPlan', 'duration'])->findOrFail($id);

        if ($saving->status !== 'active') {
            return response()->json(['message' => 'Only active savings can be released'], 400);
        }

        $interest = $saving->calculateInterest();
        $totalAmount = $saving->amount + $interest;

        // Credit wallet
        $wallet = $saving->user->wallet;
        $balanceBefore = $wallet->balance;
        $wallet->increment('balance', (float)$totalAmount);

        // Update saving
        $saving->update([
            'status' => 'withdrawn',
            'accrued_interest' => $interest
        ]);

        // Log transaction
        $wallet->transactions()->create([
            'user_id' => $saving->user_id,
            'reference' => 'SAV-REL-' . uniqid(),
            'type' => 'savings_withdrawal',
            'amount' => $totalAmount,
            'balance_before' => (float)$balanceBefore,
            'balance_after' => (float)$wallet->balance,
            'description' => "Funds released by Admin from {$saving->savingsPlan->name}",
            'status' => 'completed'
        ]);

        // Send email notification
        NotificationService::sendSavingsWithdrawalEmail($saving, (float)$totalAmount, (float)$interest);

        return response()->json([
            'message' => 'Funds released successfully',
            'amount' => (float)$totalAmount,
            'interest' => (float)$interest
        ]);
    }

    public function subscriptions()
    {
        $subscriptions = UserSaving::with(['user', 'savingsPlan', 'duration'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['subscriptions' => $subscriptions]);
    }
}
