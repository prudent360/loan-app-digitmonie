<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EmailTemplateController extends Controller
{
    /**
     * Get all email templates
     */
    public function index()
    {
        $templates = EmailTemplate::orderBy('name')->get();

        return response()->json([
            'templates' => $templates,
        ]);
    }

    /**
     * Get a single email template
     */
    public function show($id)
    {
        $template = EmailTemplate::findOrFail($id);
        
        return response()->json([
            'template' => $template,
        ]);
    }

    /**
     * Update an email template
     */
    public function update(Request $request, $id)
    {
        $template = EmailTemplate::findOrFail($id);

        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        $template->update($validated);

        return response()->json([
            'message' => 'Email template updated successfully',
            'template' => $template,
        ]);
    }

    /**
     * Toggle template active status
     */
    public function toggle($id)
    {
        $template = EmailTemplate::findOrFail($id);
        
        $template->update([
            'is_active' => !$template->is_active,
        ]);

        return response()->json([
            'message' => 'Template status updated',
            'template' => $template,
        ]);
    }

    /**
     * Preview a template with sample data
     */
    public function preview($id)
    {
        $template = EmailTemplate::findOrFail($id);
        
        // Generate sample data based on placeholders
        $sampleData = [];
        $placeholders = $template->placeholders ?? [];
        
        $sampleValues = [
            'customer_name' => 'John Doe',
            'email' => 'john.doe@example.com',
            'verification_link' => 'https://digitmonie.com/verify-email/test-token',
            'loan_amount' => '₦500,000.00',
            'loan_type' => 'Business Loan',
            'application_date' => date('F j, Y'),
            'reference' => 'LN-' . strtoupper(substr(uniqid(), -6)),
            'status' => 'Approved',
            'admin_notes' => 'Your application has been thoroughly reviewed and approved based on your credit score.',
            'amount' => '₦50,000.00',
            'plan_name' => 'Fixed Savings (12 Months)',
            'total_savings' => '₦250,000.00',
            'interest_earned' => '₦12,500.00',
            'date' => date('F j, Y'),
        ];

        foreach ($placeholders as $placeholder) {
            $sampleData[$placeholder] = $sampleValues[$placeholder] ?? "{{$placeholder}}";
        }

        $rendered = $template->render($sampleData);

        return response()->json([
            'subject' => $rendered['subject'],
            'body' => $rendered['body'],
            'placeholders' => $placeholders,
            'sample_data' => $sampleData,
        ]);
    }

    /**
     * Reset a template to its default content
     */
    public function reset($id)
    {
        $template = EmailTemplate::findOrFail($id);
        
        $defaults = EmailTemplate::getDefaults();
        $default = collect($defaults)->firstWhere('name', $template->name);

        if (!$default) {
            return response()->json([
                'message' => 'No default template found for this type',
            ], 404);
        }

        $template->update([
            'subject' => $default['subject'],
            'body' => $default['body'],
            'description' => $default['description'],
            'placeholders' => $default['placeholders'],
        ]);

        return response()->json([
            'message' => 'Template reset to default',
            'template' => $template,
        ]);
    }
}
