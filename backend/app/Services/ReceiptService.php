<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\BillTransaction;
use App\Models\WalletTransaction;
use App\Models\Loan;
use App\Models\Setting;

class ReceiptService
{
    public function generateBillReceipt(BillTransaction $transaction)
    {
        $logoUrl = $this->getLogoUrl();
        
        $html = $this->getBillReceiptHtml($transaction, $logoUrl);
        
        $pdf = Pdf::loadHTML($html);
        $pdf->setPaper('A4', 'portrait');
        
        return $pdf;
    }

    public function generateWalletReceipt(WalletTransaction $transaction)
    {
        $logoUrl = $this->getLogoUrl();
        
        $html = $this->getWalletReceiptHtml($transaction, $logoUrl);
        
        $pdf = Pdf::loadHTML($html);
        $pdf->setPaper('A4', 'portrait');
        
        return $pdf;
    }

    protected function getLogoUrl(): ?string
    {
        $settings = Setting::getValue('logo_url');
        return $settings ?? null;
    }

    protected function getBillReceiptHtml(BillTransaction $transaction, ?string $logoUrl): string
    {
        $date = $transaction->created_at->format('M d, Y h:i A');
        $categoryDisplay = ucfirst(strtolower(str_replace('_', ' ', $transaction->category)));
        
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Transaction Receipt</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 14px; color: #1a1a2e; background: #fff; }
        .receipt { max-width: 600px; margin: 0 auto; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
        .logo { max-height: 50px; margin-bottom: 15px; }
        .company-name { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .receipt-title { font-size: 18px; color: #666; margin-top: 10px; }
        .success-badge { display: inline-block; background: #22c55e; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; margin-top: 10px; }
        .section { margin: 25px 0; }
        .section-title { font-size: 12px; text-transform: uppercase; color: #888; margin-bottom: 10px; letter-spacing: 1px; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .info-label { color: #666; }
        .info-value { font-weight: 600; text-align: right; }
        .amount-row { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .amount-label { font-size: 12px; color: #666; }
        .amount-value { font-size: 28px; font-weight: bold; color: #3b82f6; }
        .token-box { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
        .token-label { font-size: 12px; opacity: 0.8; }
        .token-value { font-size: 24px; font-weight: bold; letter-spacing: 3px; margin-top: 5px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; }
        .reference { font-family: monospace; font-size: 11px; color: #666; }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <div class="company-name">DigitMonie</div>
            <div class="receipt-title">Transaction Receipt</div>
            <span class="success-badge">✓ {$transaction->status}</span>
        </div>

        <div class="section">
            <div class="section-title">Transaction Details</div>
            <div class="info-row">
                <span class="info-label">Reference</span>
                <span class="info-value reference">{$transaction->reference}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Date</span>
                <span class="info-value">{$date}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Category</span>
                <span class="info-value">{$categoryDisplay}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Provider</span>
                <span class="info-value">{$transaction->biller_name}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Customer ID</span>
                <span class="info-value">{$transaction->customer_id}</span>
            </div>
        </div>

        <div class="amount-row">
            <div class="amount-label">Amount Paid</div>
            <div class="amount-value">₦{$this->formatMoney($transaction->amount)}</div>
        </div>

HTML;

        // Add token section if present
        if ($transaction->token) {
            $html .= <<<HTML
        <div class="token-box">
            <div class="token-label">Your Token</div>
            <div class="token-value">{$transaction->token}</div>
        </div>
HTML;
        }

        $html .= <<<HTML
        <div class="footer">
            <p>Thank you for using DigitMonie!</p>
            <p style="margin-top: 10px;">This is an electronically generated receipt.</p>
            <p style="margin-top: 5px;">support@digitmonie.com</p>
        </div>
    </div>
</body>
</html>
HTML;

        return $html;
    }

    protected function getWalletReceiptHtml(WalletTransaction $transaction, ?string $logoUrl): string
    {
        $date = $transaction->created_at->format('M d, Y h:i A');
        $type = ucfirst($transaction->type);
        $typeColor = $transaction->type === 'credit' ? '#22c55e' : '#ef4444';
        $sign = $transaction->type === 'credit' ? '+' : '-';
        
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Wallet Receipt</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 14px; color: #1a1a2e; background: #fff; }
        .receipt { max-width: 600px; margin: 0 auto; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
        .company-name { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .receipt-title { font-size: 18px; color: #666; margin-top: 10px; }
        .type-badge { display: inline-block; background: {$typeColor}; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; margin-top: 10px; }
        .section { margin: 25px 0; }
        .section-title { font-size: 12px; text-transform: uppercase; color: #888; margin-bottom: 10px; letter-spacing: 1px; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .info-label { color: #666; }
        .info-value { font-weight: 600; text-align: right; }
        .amount-row { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .amount-label { font-size: 12px; color: #666; }
        .amount-value { font-size: 28px; font-weight: bold; color: {$typeColor}; }
        .balance-row { display: flex; justify-content: space-around; margin: 20px 0; }
        .balance-item { text-align: center; }
        .balance-label { font-size: 11px; color: #888; }
        .balance-value { font-size: 16px; font-weight: 600; color: #333; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; }
        .reference { font-family: monospace; font-size: 11px; color: #666; }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <div class="company-name">DigitMonie</div>
            <div class="receipt-title">Wallet Transaction Receipt</div>
            <span class="type-badge">{$type}</span>
        </div>

        <div class="section">
            <div class="section-title">Transaction Details</div>
            <div class="info-row">
                <span class="info-label">Reference</span>
                <span class="info-value reference">{$transaction->reference}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Date</span>
                <span class="info-value">{$date}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Description</span>
                <span class="info-value">{$transaction->description}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Status</span>
                <span class="info-value">{$transaction->status}</span>
            </div>
        </div>

        <div class="amount-row">
            <div class="amount-label">Transaction Amount</div>
            <div class="amount-value">{$sign}₦{$this->formatMoney($transaction->amount)}</div>
        </div>

        <div class="balance-row">
            <div class="balance-item">
                <div class="balance-label">Balance Before</div>
                <div class="balance-value">₦{$this->formatMoney($transaction->balance_before)}</div>
            </div>
            <div class="balance-item">
                <div class="balance-label">Balance After</div>
                <div class="balance-value">₦{$this->formatMoney($transaction->balance_after)}</div>
            </div>
        </div>

        <div class="footer">
            <p>Thank you for using DigitMonie!</p>
            <p style="margin-top: 10px;">This is an electronically generated receipt.</p>
            <p style="margin-top: 5px;">support@digitmonie.com</p>
        </div>
    </div>
</body>
</html>
HTML;
    }

    protected function formatMoney($amount): string
    {
        return number_format((float) $amount, 2);
    }
}
