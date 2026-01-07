<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SavingsPlan;
use App\Models\UserSaving;
use App\Services\SavingsNotificationService;
use Illuminate\Http\Request;

class SavingsController extends Controller
{
    public function index()
    {
        $plans = SavingsPlan::withCount('userSavings')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['plans' => $plans]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'interest_rate' => 'required|numeric|min:0|max:100',
            'min_amount' => 'required|numeric|min:0',
            'max_amount' => 'nullable|numeric|min:0',
            'lock_period_days' => 'required|integer|min:0',
            'early_withdrawal_penalty' => 'required|numeric|min:0|max:100',
        ]);

        $plan = SavingsPlan::create($request->all());

        return response()->json([
            'message' => 'Savings plan created successfully',
            'plan' => $plan
        ], 201);
    }

    public function show($id)
    {
        $plan = SavingsPlan::with(['userSavings.user'])->findOrFail($id);
        
        return response()->json(['plan' => $plan]);
    }

    public function update(Request $request, $id)
    {
        $plan = SavingsPlan::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'interest_rate' => 'required|numeric|min:0|max:100',
            'min_amount' => 'required|numeric|min:0',
            'max_amount' => 'nullable|numeric|min:0',
            'lock_period_days' => 'required|integer|min:0',
            'early_withdrawal_penalty' => 'required|numeric|min:0|max:100',
        ]);

        $plan->update($request->all());

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

    public function subscriptions()
    {
        $subscriptions = UserSaving::with(['user', 'savingsPlan'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($saving) {
                $saving->calculated_interest = $saving->calculateInterest();
                $saving->total_balance = $saving->amount + $saving->calculated_interest;
                return $saving;
            });

        return response()->json(['subscriptions' => $subscriptions]);
    }

    public function stats()
    {
        $totalPlans = SavingsPlan::count();
        $activePlans = SavingsPlan::where('status', 'active')->count();
        $totalSubscriptions = UserSaving::count();
        $totalSaved = UserSaving::where('status', 'active')->sum('amount');

        return response()->json([
            'total_plans' => $totalPlans,
            'active_plans' => $activePlans,
            'total_subscriptions' => $totalSubscriptions,
            'total_saved' => $totalSaved
        ]);
    }

    // Email Template Management

    public function getEmailTemplates()
    {
        $templates = SavingsNotificationService::getAllTemplates();
        
        $shortcodes = [
            '{user_name}' => "Customer's name",
            '{user_email}' => "Customer's email",
            '{plan_name}' => 'Savings plan name',
            '{amount}' => 'Amount deposited/withdrawn',
            '{interest_rate}' => 'Plan interest rate',
            '{total_balance}' => 'Current balance with interest',
            '{interest_earned}' => 'Accrued interest',
            '{maturity_date}' => 'When lock period ends',
            '{penalty_amount}' => 'Early withdrawal penalty',
            '{app_name}' => 'Application name',
        ];

        return response()->json([
            'templates' => $templates,
            'shortcodes' => $shortcodes
        ]);
    }

    public function updateEmailTemplate(Request $request)
    {
        $request->validate([
            'type' => 'required|string|in:savings_new,savings_withdrawal,savings_matured,savings_deposit',
            'subject' => 'required|string|max:255',
            'template' => 'required|string'
        ]);

        SavingsNotificationService::saveTemplate(
            $request->type,
            $request->subject,
            $request->template
        );

        return response()->json(['message' => 'Email template updated successfully']);
    }

    public function resetEmailTemplate(Request $request)
    {
        $request->validate([
            'type' => 'required|string|in:savings_new,savings_withdrawal,savings_matured,savings_deposit'
        ]);

        $defaults = [
            'savings_new' => [
                'subject' => 'Your Savings Plan is Active! 🎉',
                'template' => SavingsNotificationService::getDefaultNewSavingsTemplate()
            ],
            'savings_withdrawal' => [
                'subject' => 'Savings Withdrawal Successful',
                'template' => SavingsNotificationService::getDefaultWithdrawalTemplate()
            ],
            'savings_matured' => [
                'subject' => 'Your Savings Has Matured! 💰',
                'template' => SavingsNotificationService::getDefaultMaturityTemplate()
            ],
            'savings_deposit' => [
                'subject' => 'Deposit Confirmed',
                'template' => SavingsNotificationService::getDefaultDepositTemplate()
            ],
        ];

        $default = $defaults[$request->type];
        SavingsNotificationService::saveTemplate($request->type, $default['subject'], $default['template']);

        return response()->json([
            'message' => 'Email template reset to default',
            'template' => $default
        ]);
    }
}
