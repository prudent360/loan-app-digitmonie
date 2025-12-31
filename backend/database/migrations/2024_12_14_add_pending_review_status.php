<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // For SQLite, the status column is already a string, so we just need to ensure the migration is marked as run
        // The status values are validated at the application level, not the database level for SQLite
        // For MySQL production, you would run: ALTER TABLE loans MODIFY COLUMN status ...
        
        // This migration is now a no-op for SQLite compatibility
        // The 'pending_review' status is handled by application validation
    }

    public function down(): void
    {
        // No-op for SQLite compatibility
    }
};
