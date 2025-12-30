<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Modify enum to add 'pending_review' status
        DB::statement("ALTER TABLE loans MODIFY COLUMN status ENUM('pending', 'pending_review', 'under_review', 'approved', 'rejected', 'disbursed', 'active', 'completed', 'defaulted') DEFAULT 'pending'");
    }

    public function down(): void
    {
        // Revert to original enum (without pending_review)
        DB::statement("ALTER TABLE loans MODIFY COLUMN status ENUM('pending', 'under_review', 'approved', 'rejected', 'disbursed', 'active', 'completed', 'defaulted') DEFAULT 'pending'");
    }
};
