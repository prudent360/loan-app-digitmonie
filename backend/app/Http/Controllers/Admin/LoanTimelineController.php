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
    public function update(Request $request, Loan $loan, LoanTimelineStep $step)
    {
        // Verify step belongs to this loan
        if ($step->loan_id !== $loan->id) {
            return response()->json(['message' => 'Step not found'], 404);
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
        if ($request->status === 'completed' && $step->status !== 'completed') {
            $updateData['completed_by'] = auth()->id();
            $updateData['completed_at'] = now();
        }

        // Clear completion data if unmarking
        if ($request->status !== 'completed') {
            $updateData['completed_by'] = null;
            $updateData['completed_at'] = null;
        }

        $step->update($updateData);

        return response()->json([
            'message' => 'Step updated successfully',
            'step' => $step->fresh()->load('completedByUser'),
        ]);
    }

    /**
     * Complete a step (shorthand)
     */
    public function complete(Request $request, Loan $loan, LoanTimelineStep $step)
    {
        if ($step->loan_id !== $loan->id) {
            return response()->json(['message' => 'Step not found'], 404);
        }

        $step->update([
            'status' => 'completed',
            'admin_notes' => $request->notes,
            'completed_by' => auth()->id(),
            'completed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Step marked as completed',
            'step' => $step->fresh()->load('completedByUser'),
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
