<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop old savings table if exists (from previous implementation)
        Schema::dropIfExists('savings');
        
        // Admin-defined savings plans
        Schema::create('savings_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('interest_rate', 5, 2); // e.g., 17.00, 25.00, 30.00
            $table->decimal('min_amount', 15, 2)->default(1000);
            $table->decimal('max_amount', 15, 2)->nullable();
            $table->integer('lock_period_days')->default(0); // 0 = flexible
            $table->decimal('early_withdrawal_penalty', 5, 2)->default(0); // percentage
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        // Customer subscriptions to savings plans
        Schema::create('user_savings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('savings_plan_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 15, 2);
            $table->decimal('accrued_interest', 15, 2)->default(0);
            $table->date('maturity_date')->nullable();
            $table->enum('status', ['active', 'matured', 'withdrawn'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_savings');
        Schema::dropIfExists('savings_plans');
    }
};
