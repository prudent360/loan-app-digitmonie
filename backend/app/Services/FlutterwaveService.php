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

    // ==========================================
    // VIRTUAL CARDS API METHODS
    // ==========================================

    /**
     * Create a new virtual card
     */
    public function createVirtualCard($data)
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Content-Type' => 'application/json',
        ])->post($this->baseUrl . '/virtual-cards', [
            'currency' => $data['currency'] ?? 'USD',
            'amount' => $data['amount'],
            'debit_currency' => 'NGN',
            'billing_name' => $data['billing_name'],
            'billing_address' => $data['billing_address'],
            'billing_city' => $data['billing_city'],
            'billing_state' => $data['billing_state'],
            'billing_postal_code' => $data['billing_postal_code'],
            'billing_country' => $data['billing_country'] ?? 'NG',
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'date_of_birth' => $data['date_of_birth'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'title' => $data['title'] ?? 'Mr',
            'gender' => $data['gender'] ?? 'M',
            'callback_url' => $data['callback_url'] ?? null,
        ]);

        return $response->json();
    }

    /**
     * Get all virtual cards
     */
    public function getVirtualCards()
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
        ])->get($this->baseUrl . '/virtual-cards');

        return $response->json();
    }

    /**
     * Get a specific virtual card
     */
    public function getVirtualCard($cardId)
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
        ])->get($this->baseUrl . '/virtual-cards/' . $cardId);

        return $response->json();
    }

    /**
     * Fund a virtual card
     */
    public function fundVirtualCard($cardId, $amount, $debitCurrency = 'NGN')
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Content-Type' => 'application/json',
        ])->post($this->baseUrl . '/virtual-cards/' . $cardId . '/fund', [
            'amount' => $amount,
            'debit_currency' => $debitCurrency,
        ]);

        return $response->json();
    }

    /**
     * Withdraw from a virtual card
     */
    public function withdrawFromCard($cardId, $amount)
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Content-Type' => 'application/json',
        ])->post($this->baseUrl . '/virtual-cards/' . $cardId . '/withdraw', [
            'amount' => $amount,
        ]);

        return $response->json();
    }

    /**
     * Block a virtual card
     */
    public function blockCard($cardId)
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
        ])->put($this->baseUrl . '/virtual-cards/' . $cardId . '/status/block');

        return $response->json();
    }

    /**
     * Unblock a virtual card
     */
    public function unblockCard($cardId)
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
        ])->put($this->baseUrl . '/virtual-cards/' . $cardId . '/status/unblock');

        return $response->json();
    }

    /**
     * Terminate/Cancel a virtual card
     */
    public function terminateCard($cardId)
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
        ])->put($this->baseUrl . '/virtual-cards/' . $cardId . '/terminate');

        return $response->json();
    }

    /**
     * Get virtual card transactions
     */
    public function getCardTransactions($cardId, $from = null, $to = null, $index = 1, $size = 20)
    {
        $params = [
            'index' => $index,
            'size' => $size,
        ];
        
        if ($from) $params['from'] = $from;
        if ($to) $params['to'] = $to;

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
        ])->get($this->baseUrl . '/virtual-cards/' . $cardId . '/transactions', $params);

        return $response->json();
    }

    // ==========================================
    // BILL PAYMENTS API METHODS
    // ==========================================

    /**
     * Get bill payment categories
     */
    public function getBillCategories()
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
        ])->get($this->baseUrl . '/bill-categories');

        return $response->json();
    }

    /**
     * Get billers for a specific category
     */
    public function getBillers($category, $country = 'NG')
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
        ])->get($this->baseUrl . '/billers', [
            'category' => $category,
            'country' => $country,
        ]);

        return $response->json();
    }

    /**
     * Get biller items/packages
     */
    public function getBillItems($billerCode)
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
        ])->get($this->baseUrl . '/billers/' . $billerCode . '/items');

        return $response->json();
    }

    /**
     * Validate customer for bill payment (e.g., meter number, decoder number)
     */
    public function validateBillCustomer($itemCode, $billerCode, $customerId)
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Content-Type' => 'application/json',
        ])->get($this->baseUrl . '/bill-items/' . $itemCode . '/validate', [
            'code' => $billerCode,
            'customer' => $customerId,
        ]);

        return $response->json();
    }

    /**
     * Create a bill payment
     */
    public function payBill($data)
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Content-Type' => 'application/json',
        ])->post($this->baseUrl . '/bills', [
            'country' => $data['country'] ?? 'NG',
            'customer' => $data['customer_id'],
            'amount' => $data['amount'],
            'recurrence' => $data['recurrence'] ?? 'ONCE',
            'type' => $data['type'],
            'reference' => $data['reference'],
            'biller_name' => $data['biller_name'] ?? null,
        ]);

        return $response->json();
    }

    /**
     * Get bill payment status
     */
    public function getBillPaymentStatus($reference)
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
        ])->get($this->baseUrl . '/bills/' . $reference);

        return $response->json();
    }

    /**
     * Get bill payment history
     */
    public function getBillPaymentHistory($from = null, $to = null, $page = 1, $reference = null)
    {
        $params = ['page' => $page];
        
        if ($from) $params['from'] = $from;
        if ($to) $params['to'] = $to;
        if ($reference) $params['reference'] = $reference;

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
        ])->get($this->baseUrl . '/bills', $params);

        return $response->json();
    }
}
