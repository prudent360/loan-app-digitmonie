<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\User;
use App\Models\UserSaving;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SavingsNotificationService
{
    /**
     * Available shortcodes:
     * {user_name} - Customer's name
     * {user_email} - Customer's email
     * {plan_name} - Savings plan name
     * {amount} - Amount deposited/withdrawn
     * {interest_rate} - Plan interest rate
     * {total_balance} - Current balance with interest
     * {interest_earned} - Accrued interest
     * {maturity_date} - When lock period ends
     * {penalty_amount} - Early withdrawal penalty
     * {app_name} - Application name
     */

    public static function sendNewSavingsEmail(UserSaving $saving): void
    {
        $template = Setting::getValue('email_templates.savings_new', self::getDefaultNewSavingsTemplate());
        $subject = Setting::getValue('email_subjects.savings_new', 'Your Savings Plan is Active! 🎉');
        
        $content = self::parseTemplate($template, $saving);
        self::sendEmail($saving->user, $subject, $content);
    }

    public static function sendWithdrawalEmail(UserSaving $saving, float $amount, float $penalty = 0): void
    {
        $template = Setting::getValue('email_templates.savings_withdrawal', self::getDefaultWithdrawalTemplate());
        $subject = Setting::getValue('email_subjects.savings_withdrawal', 'Savings Withdrawal Successful');
        
        $content = self::parseTemplate($template, $saving, [
            'amount' => $amount,
            'penalty_amount' => $penalty
        ]);
        self::sendEmail($saving->user, $subject, $content);
    }

    public static function sendMaturityEmail(UserSaving $saving): void
    {
        $template = Setting::getValue('email_templates.savings_matured', self::getDefaultMaturityTemplate());
        $subject = Setting::getValue('email_subjects.savings_matured', 'Your Savings Has Matured! 💰');
        
        $content = self::parseTemplate($template, $saving);
        self::sendEmail($saving->user, $subject, $content);
    }

    public static function sendDepositEmail(UserSaving $saving, float $amount): void
    {
        $template = Setting::getValue('email_templates.savings_deposit', self::getDefaultDepositTemplate());
        $subject = Setting::getValue('email_subjects.savings_deposit', 'Deposit Confirmed');
        
        $content = self::parseTemplate($template, $saving, ['amount' => $amount]);
        self::sendEmail($saving->user, $subject, $content);
    }

    private static function parseTemplate(string $template, UserSaving $saving, array $extra = []): string
    {
        $appName = Setting::getValue('app_name', 'DigitMonie');
        
        $replacements = [
            '{user_name}' => $saving->user->name,
            '{user_email}' => $saving->user->email,
            '{plan_name}' => $saving->savingsPlan->name,
            '{amount}' => '₦' . number_format($extra['amount'] ?? $saving->amount, 2),
            '{interest_rate}' => $saving->savingsPlan->interest_rate . '%',
            '{total_balance}' => '₦' . number_format($saving->amount + $saving->calculateInterest(), 2),
            '{interest_earned}' => '₦' . number_format($saving->calculateInterest(), 2),
            '{maturity_date}' => $saving->maturity_date ? $saving->maturity_date->format('F j, Y') : 'Flexible',
            '{penalty_amount}' => '₦' . number_format($extra['penalty_amount'] ?? 0, 2),
            '{app_name}' => $appName,
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $template);
    }

    private static function sendEmail(User $user, string $subject, string $content): void
    {
        try {
            Mail::html($content, function ($message) use ($user, $subject) {
                $message->to($user->email, $user->name)
                    ->subject($subject);
            });
        } catch (\Exception $e) {
            Log::error('Failed to send savings email: ' . $e->getMessage());
        }
    }

    // Default Templates

    public static function getDefaultNewSavingsTemplate(): string
    {
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Savings Plan Activated!</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{user_name}</strong>,</p>
            <p>Congratulations! Your savings plan has been successfully created and is now active.</p>
            
            <div class="highlight">
                <p><strong>Plan Details:</strong></p>
                <p>📌 Plan: {plan_name}</p>
                <p>💰 Amount Saved: {amount}</p>
                <p>📈 Interest Rate: {interest_rate} per annum</p>
                <p>📅 Maturity Date: {maturity_date}</p>
            </div>
            
            <p>Your money is now growing! Log in to your dashboard to track your savings progress.</p>
            
            <p>Best regards,<br>{app_name} Team</p>
        </div>
        <div class="footer">
            <p>This is an automated email from {app_name}. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }

    public static function getDefaultWithdrawalTemplate(): string
    {
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #059669, #047857); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .warning { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💸 Withdrawal Successful</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{user_name}</strong>,</p>
            <p>Your savings withdrawal has been processed successfully.</p>
            
            <div class="highlight">
                <p><strong>Withdrawal Details:</strong></p>
                <p>📌 Plan: {plan_name}</p>
                <p>💰 Amount Withdrawn: {amount}</p>
                <p>📈 Interest Earned: {interest_earned}</p>
            </div>
            
            <p>The funds have been credited to your wallet.</p>
            
            <p>Best regards,<br>{app_name} Team</p>
        </div>
        <div class="footer">
            <p>This is an automated email from {app_name}. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }

    public static function getDefaultMaturityTemplate(): string
    {
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎊 Your Savings Has Matured!</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{user_name}</strong>,</p>
            <p>Great news! Your savings plan has reached maturity and you can now withdraw without any penalties!</p>
            
            <div class="highlight">
                <p><strong>Your Savings Summary:</strong></p>
                <p>📌 Plan: {plan_name}</p>
                <p>💰 Total Balance: {total_balance}</p>
                <p>📈 Interest Earned: {interest_earned}</p>
            </div>
            
            <p>Log in to your dashboard to withdraw your funds or let it keep growing!</p>
            
            <p>Best regards,<br>{app_name} Team</p>
        </div>
        <div class="footer">
            <p>This is an automated email from {app_name}. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }

    public static function getDefaultDepositTemplate(): string
    {
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Deposit Confirmed</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{user_name}</strong>,</p>
            <p>Your deposit has been successfully added to your savings plan.</p>
            
            <div class="highlight">
                <p><strong>Deposit Details:</strong></p>
                <p>📌 Plan: {plan_name}</p>
                <p>💰 Deposit Amount: {amount}</p>
                <p>💵 New Balance: {total_balance}</p>
            </div>
            
            <p>Your money is working hard for you!</p>
            
            <p>Best regards,<br>{app_name} Team</p>
        </div>
        <div class="footer">
            <p>This is an automated email from {app_name}. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }

    // Get all templates for admin editing
    public static function getAllTemplates(): array
    {
        return [
            'savings_new' => [
                'subject' => Setting::getValue('email_subjects.savings_new', 'Your Savings Plan is Active! 🎉'),
                'template' => Setting::getValue('email_templates.savings_new', self::getDefaultNewSavingsTemplate()),
            ],
            'savings_withdrawal' => [
                'subject' => Setting::getValue('email_subjects.savings_withdrawal', 'Savings Withdrawal Successful'),
                'template' => Setting::getValue('email_templates.savings_withdrawal', self::getDefaultWithdrawalTemplate()),
            ],
            'savings_matured' => [
                'subject' => Setting::getValue('email_subjects.savings_matured', 'Your Savings Has Matured! 💰'),
                'template' => Setting::getValue('email_templates.savings_matured', self::getDefaultMaturityTemplate()),
            ],
            'savings_deposit' => [
                'subject' => Setting::getValue('email_subjects.savings_deposit', 'Deposit Confirmed'),
                'template' => Setting::getValue('email_templates.savings_deposit', self::getDefaultDepositTemplate()),
            ],
        ];
    }

    // Save template from admin
    public static function saveTemplate(string $type, string $subject, string $template): void
    {
        Setting::setValue("email_subjects.{$type}", $subject);
        Setting::setValue("email_templates.{$type}", $template);
    }
}
