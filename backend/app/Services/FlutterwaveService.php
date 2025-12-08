<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Models\Setting;

class FlutterwaveService
{
    protected $secretKey;
    protected $publicKey;
    protected $baseUrl = 'https://api.flutterwave.com/v3';

    public function __construct()
    {
        $settings = Setting::getValue('payment_gateways', []);
        $this->secretKey = $settings['flutterwave']['secret_key'] ?? '';
        $this->publicKey = $settings['flutterwave']['public_key'] ?? '';
    }

    public function initializeTransaction($email, $amount, $reference, $redirectUrl, $customerName, $metadata = [])
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Content-Type' => 'application/json',
        ])->post($this->baseUrl . '/payments', [
            'tx_ref' => $reference,
            'amount' => $amount,
            'currency' => 'NGN',
            'redirect_url' => $redirectUrl,
            'customer' => [
                'email' => $email,
                'name' => $customerName,
            ],
            'meta' => $metadata,
            'customizations' => [
                'title' => 'DigitMonie Loan Payment',
                'description' => 'Loan repayment',
            ],
        ]);

        return $response->json();
    }

    public function verifyTransaction($transactionId)
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
        ])->get($this->baseUrl . '/transactions/' . $transactionId . '/verify');

        return $response->json();
    }

    public function getPublicKey()
    {
        return $this->publicKey;
    }

    public function isConfigured()
    {
        return !empty($this->secretKey) && !empty($this->publicKey);
    }
}
