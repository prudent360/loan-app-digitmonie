<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('loan_id')->constrained()->onDelete('cascade');
            $table->foreignId('repayment_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('amount', 15, 2);
            $table->string('gateway'); // paystack, flutterwave
            $table->string('reference')->unique();
            $table->string('gateway_reference')->nullable();
            $table->enum('status', ['pending', 'success', 'failed'])->default('pending');
            $table->json('gateway_response')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        // Add payment gateway settings
        DB::table('settings')->insert([
            'key' => 'payment_gateways',
            'value' => json_encode([
                'active_gateway' => 'paystack',
                'paystack' => [
                    'public_key' => '',
                    'secret_key' => '',
                    'enabled' => true,
                ],
                'flutterwave' => [
                    'public_key' => '',
                    'secret_key' => '',
                    'enabled' => false,
                ],
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        DB::table('settings')->where('key', 'payment_gateways')->delete();
    }
};
