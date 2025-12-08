<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 15, 2);
            $table->decimal('interest_rate', 5, 2)->default(15.00);
            $table->integer('tenure_months');
            $table->string('purpose');
            $table->text('purpose_details')->nullable();
            $table->enum('employment_type', ['employed', 'self_employed', 'business', 'contract', 'retired'])->nullable();
            $table->decimal('monthly_income', 15, 2)->nullable();
            $table->string('bank_name')->nullable();
            $table->string('account_number')->nullable();
            $table->enum('status', ['pending', 'under_review', 'approved', 'rejected', 'disbursed', 'active', 'completed', 'defaulted'])->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('disbursed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
