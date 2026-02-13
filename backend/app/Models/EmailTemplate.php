<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'subject',
        'body',
        'description',
        'placeholders',
        'is_active',
    ];

    protected $casts = [
        'placeholders' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Get a template by name
     */
    public static function getByName(string $name): ?self
    {
        return static::where('name', $name)->where('is_active', true)->first();
    }

    /**
     * Replace placeholders in the template with actual values
     */
    public function render(array $data): array
    {
        $subject = $this->subject;
        $body = $this->body;

        // Handle simple if blocks: {{#if key}} content {{/if}}
        $body = preg_replace_callback('/{{#if\s+([a-zA-Z0-9_]+)}}(.*?){{\/if}}/s', function($matches) use ($data) {
            $key = $matches[1];
            $content = $matches[2];
            return (!empty($data[$key])) ? $content : '';
        }, $body);

        $subject = preg_replace_callback('/{{#if\s+([a-zA-Z0-9_]+)}}(.*?){{\/if}}/s', function($matches) use ($data) {
            $key = $matches[1];
            $content = $matches[2];
            return (!empty($data[$key])) ? $content : '';
        }, $subject);

        foreach ($data as $key => $value) {
            $placeholder = '{{' . $key . '}}';
            $subject = str_replace($placeholder, (string)$value, $subject);
            $body = str_replace($placeholder, (string)$value, $body);
        }

        return [
            'subject' => $subject,
            'body' => $body,
        ];
    }

    /**
     * Get default templates for seeding
     */
    public static function getDefaults(): array
    {
        return [
            [
                'name' => 'welcome_email',
                'subject' => 'Welcome to Digitmonie, {{customer_name}}!',
                'description' => 'Sent when a new user registers',
                'placeholders' => ['customer_name', 'email', 'verification_link'],
                'body' => '<h2>Welcome to Digitmonie!</h2>
<p>Dear {{customer_name}},</p>
<p>Thank you for joining Digitmonie! We are excited to help you achieve your financial goals.</p>
<p>Before you can start using your account, please verify your email address by clicking the button below:</p>
<div style="text-align: center; margin: 30px 0;">
    <a href="{{verification_link}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
</div>
<p>If the button doesn\'t work, copy and paste this link into your browser:</p>
<p>{{verification_link}}</p>
<p>Best regards,<br>The Digitmonie Team</p>',
            ],
            [
                'name' => 'loan_application_submitted',
                'subject' => 'Loan Application Submitted - {{loan_amount}}',
                'description' => 'Sent when a user submits a loan application',
                'placeholders' => ['customer_name', 'loan_amount', 'loan_type', 'application_date', 'reference'],
                'body' => '<h2>Loan Application Received</h2>
<p>Dear {{customer_name}},</p>
<p>Your loan application for {{loan_amount}} has been successfully submitted and is now under review.</p>
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Amount:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">{{loan_amount}}</td></tr>
    <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Type:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">{{loan_type}}</td></tr>
    <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Date:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">{{application_date}}</td></tr>
    <tr><td style="padding: 10px;"><strong>Reference:</strong></td><td style="padding: 10px;">{{reference}}</td></tr>
</table>
<p>We will notify you once your application has been processed.</p>',
            ],
            [
                'name' => 'loan_status_updated',
                'subject' => 'Loan Application Update - {{status}}',
                'description' => 'Sent when a loan status changes (Approved, Rejected, etc.)',
                'placeholders' => ['customer_name', 'loan_amount', 'status', 'admin_notes', 'reference'],
                'body' => '<h2>Loan Status Update</h2>
<p>Dear {{customer_name}},</p>
<p>The status of your loan application ({{reference}}) has been updated to: <strong>{{status}}</strong></p>
{{#if admin_notes}}
<div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
    <strong>Note from Admin:</strong><br>
    {{admin_notes}}
</div>
{{/if}}
<p>Please log in to your dashboard for more details.</p>',
            ],
            [
                'name' => 'savings_contribution',
                'subject' => 'Savings Contribution Received - {{amount}}',
                'description' => 'Sent when a user adds funds to their savings',
                'placeholders' => ['customer_name', 'amount', 'plan_name', 'total_savings', 'date'],
                'body' => '<h2>Savings Contribution Confirmed</h2>
<p>Dear {{customer_name}},</p>
<p>We have successfully received your savings contribution of {{amount}} for your {{plan_name}} plan.</p>
<p><strong>Total Savings:</strong> {{total_savings}}</p>
<p>Keep up the great work! Saving consistently is the key to financial freedom.</p>',
            ],
             [
                'name' => 'savings_withdrawal',
                'subject' => 'Savings Withdrawal Successful - {{amount}}',
                'description' => 'Sent when a user withdraws from their savings',
                'placeholders' => ['customer_name', 'amount', 'plan_name', 'interest_earned', 'date'],
                'body' => '<h2>Savings Withdrawal Confirmed</h2>
<p>Dear {{customer_name}},</p>
<p>Your withdrawal of {{amount}} from your {{plan_name}} plan has been successfully processed.</p>
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Amount Withdrawn:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">{{amount}}</td></tr>
    <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Interest Earned:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">{{interest_earned}}</td></tr>
    <tr><td style="padding: 10px;"><strong>Date:</strong></td><td style="padding: 10px;">{{date}}</td></tr>
</table>
<p>The funds have been credited to your wallet.</p>',
            ],
            [
                'name' => 'loan_approved',
                'subject' => 'Congratulations! Your Loan is Approved - {{loan_amount}}',
                'description' => 'Sent when a loan application is approved',
                'placeholders' => ['customer_name', 'loan_amount', 'reference', 'admin_notes'],
                'body' => '<h2>Loan Approved!</h2>
<p>Dear {{customer_name}},</p>
<p>Great news! Your loan application for {{loan_amount}} has been approved.</p>
<p><strong>Reference:</strong> {{reference}}</p>
{{#if admin_notes}}
<div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
    {{admin_notes}}
</div>
{{/if}}
<p>The funds will be disbursed to your wallet shortly. Thank you for choosing Digitmonie!</p>',
            ],
            [
                'name' => 'loan_rejected',
                'subject' => 'Update on Your Loan Application - {{reference}}',
                'description' => 'Sent when a loan application is rejected',
                'placeholders' => ['customer_name', 'reference', 'admin_notes'],
                'body' => '<h2>Loan Application Update</h2>
<p>Dear {{customer_name}},</p>
<p>We regret to inform you that your loan application ({{reference}}) was not approved at this time.</p>
{{#if admin_notes}}
<div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #ec4899; margin: 20px 0;">
    <strong>Reason:</strong><br>
    {{admin_notes}}
</div>
{{/if}}
<p>You may apply again after 30 days. Feel free to contact our support if you have any questions.</p>',
            ],
            [
                'name' => 'loan_step_processing',
                'subject' => 'Loan Update: Your Application is Now Processing',
                'description' => 'Sent when a loan timeline step is marked as processing',
                'placeholders' => ['customer_name', 'reference', 'step_name'],
                'body' => '<h2>Loan Application Progress</h2>
<p>Dear {{customer_name}},</p>
<p>Your loan application ({{reference}}) has moved to the next stage: <strong>{{step_name}}</strong></p>
<p>Status: <span style="color: #f59e0b; font-weight: bold;">Processing</span></p>
<p>Our team is currently working on this step. We will notify you once it\'s completed.</p>',
            ],
            [
                'name' => 'loan_step_completed',
                'subject' => 'Loan Update: {{step_name}} Completed',
                'description' => 'Sent when a loan timeline step is marked as completed',
                'placeholders' => ['customer_name', 'reference', 'step_name'],
                'body' => '<h2>Loan Step Completed</h2>
<p>Dear {{customer_name}},</p>
<p>We are pleased to inform you that the <strong>{{step_name}}</strong> stage for your loan application ({{reference}}) is now complete.</p>
<p>Status: <span style="color: #10b981; font-weight: bold;">Completed</span></p>
<p>We are moving forward with the remaining steps.</p>',
            ],
            [
                'name' => 'wallet_funded',
                'subject' => 'Wallet Funded Successfully - {{amount}}',
                'description' => 'Sent when a bank transfer funding is approved',
                'placeholders' => ['customer_name', 'amount', 'new_balance', 'reference'],
                'body' => '<h2>Wallet Funded</h2>
<p>Dear {{customer_name}},</p>
<p>Your wallet has been successfully credited with {{amount}} via bank transfer.</p>
<p><strong>New Balance:</strong> {{new_balance}}</p>
<p><strong>Reference:</strong> {{reference}}</p>
<p>You can now use these funds for loan repayments or other services.</p>',
            ],
            [
                'name' => 'funding_rejected',
                'subject' => 'Funding Request Update - Rejected',
                'description' => 'Sent when a bank transfer funding is rejected',
                'placeholders' => ['customer_name', 'amount', 'reason', 'reference'],
                'body' => '<h2>Funding Request Update</h2>
<p>Dear {{customer_name}},</p>
<p>We regret to inform you that your funding request for {{amount}} (Ref: {{reference}}) was not approved.</p>
<p><strong>Reason:</strong> {{reason}}</p>
<p>If you believe this is a mistake, please contact our support team with your proof of payment.</p>',
            ],
        ];
    }
}
