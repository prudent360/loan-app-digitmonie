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
        Schema::create('virtual_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('flw_card_id')->unique();
            $table->string('card_pan')->nullable(); // Last 4 digits only for display
            $table->string('masked_pan')->nullable();
            $table->string('currency', 3)->default('USD');
            $table->decimal('balance', 15, 2)->default(0);
            $table->string('card_type')->default('virtual'); // virtual, physical
            $table->string('status')->default('active'); // active, blocked, terminated
            $table->string('name_on_card')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('cvv')->nullable(); // Encrypted or not stored for security
            $table->json('billing_address')->nullable();
            $table->timestamp('last_funded_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('virtual_cards');
    }
};
