<?php

namespace App\Services;

use App\Mail\TemplateEmail;
use App\Models\User;
use App\Models\UserSaving;
use App\Models\Loan;
use App\Models\Setting;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;

class NotificationService
{
    /**
     * Send an email using a template
     */
    public static function sendEmail(User $user, string $templateName, array $data): void
    {
        try {
            self::configureMail();
            Mail::to($user->email)->send(new TemplateEmail($templateName, $data));
        } catch (\Exception $e) {
            Log::error("Failed to send email template '{$templateName}' to {$user->email}: " . $e->getMessage());
        }
    }

    /**
     * Configure mail at runtime using database settings
     */
    private static function configureMail(): void
    {
        $settings = Setting::getValue('email_settings');
        
        if (!$settings) {
            return;
        }

        $mailer = $settings['mail_mailer'] ?? 'smtp';
        if ($mailer === 'log') {
            return;
        }

        Config::set('mail.default', $mailer);
        Config::set('mail.mailers.smtp.host', $settings['mail_host'] ?? env('MAIL_HOST'));
        Config::set('mail.mailers.smtp.port', $settings['mail_port'] ?? env('MAIL_PORT'));
        Config::set('mail.mailers.smtp.username', $settings['mail_username'] ?? env('MAIL_USERNAME'));
        Config::set('mail.mailers.smtp.password', $settings['mail_password'] ?? env('MAIL_PASSWORD'));
        Config::set('mail.mailers.smtp.encryption', $settings['mail_encryption'] ?? env('MAIL_ENCRYPTION'));
        
        Config::set('mail.from.address', $settings['mail_from_address'] ?? env('MAIL_FROM_ADDRESS'));
        Config::set('mail.from.name', $settings['mail_from_name'] ?? env('MAIL_FROM_NAME'));
    }

    /**
     * Welcome/Verification Email
     */
    public static function sendWelcomeEmail(User $user, string $verificationUrl): void
    {
        self::sendEmail($user, 'welcome_email', [
            'customer_name' => $user->name,
            'email' => $user->email,
            'verification_link' => $verificationUrl
        ]);
    }

    /**
     * Loan Application Submitted
     */
    public static function sendLoanSubmittedEmail(Loan $loan): void
    {
        self::sendEmail($loan->user, 'loan_application_submitted', [
            'customer_name' => $loan->user->name,
            'loan_amount' => '₦' . number_format((float)$loan->amount, 2),
            'loan_type' => $loan->loanType->name ?? 'Loan',
            'application_date' => $loan->created_at->format('F j, Y'),
            'reference' => $loan->reference
        ]);
    }

    /**
     * Loan Status Updated (Approved/Rejected)
     */
    public static function sendLoanStatusUpdateEmail(Loan $loan): void
    {
        $template = $loan->status === 'approved' ? 'loan_approved' : ($loan->status === 'rejected' ? 'loan_rejected' : 'loan_status_updated');
        
        self::sendEmail($loan->user, $template, [
            'customer_name' => $loan->user->name,
            'loan_amount' => '₦' . number_format((float)$loan->amount, 2),
            'status' => ucfirst($loan->status),
            'admin_notes' => $loan->admin_notes ?? '',
            'reference' => $loan->reference
        ]);
    }

    /**
     * Loan Step Update
     */
    public static function sendLoanStepUpdateEmail(Loan $loan, $step, $status): void
    {
        $template = $status === 'completed' ? 'loan_step_completed' : 'loan_step_processing';
        
        self::sendEmail($loan->user, $template, [
            'customer_name' => $loan->user->name,
            'reference' => $loan->reference,
            'step_name' => $step->name
        ]);
    }

    /**
     * Savings Emails (Proxy to keep compatibility or replace)
     */
    public static function sendSavingsContributionEmail(UserSaving $saving, float $amount): void
    {
        self::sendEmail($saving->user, 'savings_contribution', [
            'customer_name' => $saving->user->name,
            'amount' => '₦' . number_format((float)$amount, 2),
            'plan_name' => $saving->savingsPlan->name,
            'total_savings' => '₦' . number_format((float)$saving->amount, 2),
            'date' => date('F j, Y')
        ]);
    }

    public static function sendSavingsWithdrawalEmail(UserSaving $saving, float $amount, float $interest): void
    {
        self::sendEmail($saving->user, 'savings_withdrawal', [
            'customer_name' => $saving->user->name,
            'amount' => '₦' . number_format((float)$amount, 2),
            'plan_name' => $saving->savingsPlan->name,
            'interest_earned' => '₦' . number_format((float)$interest, 2),
            'date' => date('F j, Y')
        ]);
    }

    /**
     * Wallet Funding Emails
     */
    public static function sendWalletFundedEmail(\App\Models\User $user, float $amount, float $newBalance, string $reference): void
    {
        self::sendEmail($user, 'wallet_funded', [
            'customer_name' => $user->name,
            'amount' => '₦' . number_format((float)$amount, 2),
            'new_balance' => '₦' . number_format((float)$newBalance, 2),
            'reference' => $reference
        ]);
    }

    public static function sendFundingRejectedEmail(\App\Models\User $user, float $amount, string $reason, string $reference): void
    {
        self::sendEmail($user, 'funding_rejected', [
            'customer_name' => $user->name,
            'amount' => '₦' . number_format((float)$amount, 2),
            'reason' => $reason,
            'reference' => $reference
        ]);
    }

    public static function sendTestEmail(string $email): void
    {
        self::configureMail();
        Mail::raw("This is a test email to verify your SMTP settings at Digitmonie. If you received this, your email configuration is correct.", function($message) use ($email) {
            $message->to($email)->subject("SMTP Test - Digitmonie");
        });
    }
}
