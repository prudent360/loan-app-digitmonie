<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bill_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('reference')->unique();
            $table->string('flw_ref')->nullable(); // Flutterwave reference
            $table->string('category'); // airtime, data, electricity, cable, internet
            $table->string('biller_code');
            $table->string('biller_name');
            $table->string('item_code')->nullable();
            $table->string('item_name')->nullable(); // Package name
            $table->string('customer_id'); // Phone number, meter number, decoder number
            $table->string('customer_name')->nullable(); // Customer name from validation
            $table->decimal('amount', 15, 2);
            $table->decimal('fee', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2); // amount + fee
            $table->string('status')->default('pending'); // pending, processing, successful, failed
            $table->string('token')->nullable(); // Electricity token or PIN
            $table->text('failure_reason')->nullable();
            $table->json('response_data')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['category', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bill_transactions');
    }
};
