<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\LoanTimelineStep;
use Illuminate\Http\Request;

class LoanTimelineController extends Controller
{
    /**
     * Get timeline steps for a loan
     */
    public function index(Loan $loan)
    {
        // Create default steps if none exist
        if ($loan->timelineSteps()->count() === 0) {
            LoanTimelineStep::createForLoan($loan);
        }

        return response()->json([
            'steps' => $loan->timelineSteps()->with('completedByUser')->get(),
        ]);
    }

    /**
     * Update a timeline step
     */
    public function update(Request $request, Loan $loan, LoanTimelineStep $timelineStep)
    {
        // Verify step belongs to this loan
        \Illuminate\Support\Facades\Log::info('Timeline Update Check:', [
            'loan_id_param' => $loan->id,
            'step_loan_id' => $timelineStep->loan_id,
            'loan_id_type' => gettype($loan->id),
            'step_loan_id_type' => gettype($timelineStep->loan_id)
        ]);

        if ($timelineStep->loan_id != $loan->id) {
            return response()->json([
                'message' => 'Step not found',
                'debug' => [
                    'loan_id' => $loan->id,
                    'step_loan_id' => $timelineStep->loan_id
                ]
            ], 404);
        }

        $request->validate([
            'status' => 'required|in:pending,in_progress,completed,failed',
            'admin_notes' => 'nullable|string|max:500',
        ]);

        $updateData = [
            'status' => $request->status,
            'admin_notes' => $request->admin_notes,
        ];

        // Set completion data if marking as completed
        if ($request->status === 'completed' && $timelineStep->status !== 'completed') {
            $updateData['completed_by'] = auth()->id();
            $updateData['completed_at'] = now();
        }

        // Clear completion data if unmarking
        if ($request->status !== 'completed') {
            $updateData['completed_by'] = null;
            $updateData['completed_at'] = null;
        }

        $timelineStep->update($updateData);

        // Notify User if completed
        if ($request->status === 'completed') {
            \App\Services\NotificationService::sendLoanStepUpdateEmail($loan, $timelineStep, 'completed');
        } elseif ($request->status === 'in_progress') {
            \App\Services\NotificationService::sendLoanStepUpdateEmail($loan, $timelineStep, 'processing');
        }

        return response()->json([
            'message' => 'Step updated successfully',
            'step' => $timelineStep->fresh()->load('completedByUser'),
        ]);
    }

    /**
     * Complete a step (shorthand)
     */
    public function complete(Request $request, Loan $loan, LoanTimelineStep $timelineStep)
    {
        if ($timelineStep->loan_id != $loan->id) {
            return response()->json(['message' => 'Step not found'], 404);
        }

        $timelineStep->update([
            'status' => 'completed',
            'admin_notes' => $request->notes,
            'completed_by' => auth()->id(),
            'completed_at' => now(),
        ]);

        // Notify User
        \App\Services\NotificationService::sendLoanStepUpdateEmail($loan, $timelineStep, 'completed');

        return response()->json([
            'message' => 'Step marked as completed',
            'step' => $timelineStep->fresh()->load('completedByUser'),
        ]);
    }

    /**
     * Reset all steps for a loan
     */
    public function reset(Loan $loan)
    {
        $loan->timelineSteps()->delete();
        LoanTimelineStep::createForLoan($loan);

        return response()->json([
            'message' => 'Timeline reset successfully',
            'steps' => $loan->timelineSteps()->get(),
        ]);
    }
}
