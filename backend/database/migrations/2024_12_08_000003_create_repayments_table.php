<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repayments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 15, 2);
            $table->decimal('principal', 15, 2);
            $table->decimal('interest', 15, 2);
            $table->date('due_date');
            $table->timestamp('paid_at')->nullable();
            $table->enum('status', ['pending', 'paid', 'overdue', 'partial'])->default('pending');
            $table->string('payment_reference')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repayments');
    }
};
