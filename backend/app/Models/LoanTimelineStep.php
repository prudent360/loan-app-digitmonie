<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoanTimelineStep extends Model
{
    protected $fillable = [
        'loan_id',
        'step_number',
        'title',
        'description',
        'status',
        'admin_notes',
        'completed_by',
        'completed_at',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }

    public function completedByUser()
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    /**
     * Get default timeline steps for a new loan
     */
    public static function getDefaultSteps()
    {
        return [
            ['step_number' => 1, 'title' => 'Application Submitted', 'description' => 'Loan application received'],
            ['step_number' => 2, 'title' => 'Documents Under Review', 'description' => 'Your documents are being verified'],
            ['step_number' => 3, 'title' => 'Application Reviewed', 'description' => 'Application under final review'],
            ['step_number' => 4, 'title' => 'Loan Approved', 'description' => 'Your loan has been approved'],
            ['step_number' => 5, 'title' => 'Loan Disbursed', 'description' => 'Funds transferred to your account'],
        ];
    }

    /**
     * Create default timeline steps for a loan
     */
    public static function createForLoan(Loan $loan)
    {
        $steps = [];
        foreach (self::getDefaultSteps() as $index => $stepData) {
            $steps[] = self::create([
                'loan_id' => $loan->id,
                'step_number' => $stepData['step_number'],
                'title' => $stepData['title'],
                'description' => $stepData['description'],
                'status' => $index === 0 ? 'completed' : 'pending', // First step is auto-completed
                'completed_at' => $index === 0 ? $loan->created_at : null,
            ]);
        }
        return $steps;
    }
}
