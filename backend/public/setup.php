<?php
/**
 * DigitMonie Setup Script
 * 
 * Upload this file to your api/public/ folder and access it via browser:
 * https://app.digitmonie.com/api/setup.php
 * 
 * DELETE THIS FILE AFTER SETUP IS COMPLETE!
 */

// Prevent timeout
set_time_limit(300);
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Change to Laravel root directory
chdir(__DIR__ . '/..');

echo "<html><head><title>DigitMonie Setup</title>";
echo "<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: #f8fafc; }
    .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { color: #1e293b; margin-bottom: 8px; }
    .subtitle { color: #64748b; margin-bottom: 24px; }
    .step { padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; }
    .success { background: #dcfce7; color: #166534; }
    .error { background: #fee2e2; color: #991b1b; }
    .warning { background: #fef9c3; color: #854d0e; }
    .info { background: #dbeafe; color: #1e40af; }
    pre { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; }
    .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px; }
    .btn:hover { background: #1d4ed8; }
    .danger { background: #dc2626; }
</style></head><body>";

echo "<div class='card'>";
echo "<h1>🚀 DigitMonie Setup</h1>";
echo "<p class='subtitle'>One-time setup script for your Laravel backend</p>";

$steps = [];

// Step 1: Check PHP version
$phpVersion = phpversion();
if (version_compare($phpVersion, '8.2.0', '>=')) {
    $steps[] = ['success', "✓ PHP Version: $phpVersion"];
} else {
    $steps[] = ['error', "✗ PHP Version: $phpVersion (requires 8.2+)"];
}

// Step 2: Check if .env exists
if (file_exists('.env')) {
    $steps[] = ['success', "✓ .env file exists"];
} else {
    if (file_exists('.env.example')) {
        copy('.env.example', '.env');
        $steps[] = ['warning', "⚠ Created .env from .env.example - Please configure database credentials!"];
    } else {
        $steps[] = ['error', "✗ .env file missing and no .env.example found"];
    }
}

// Step 3: Check required directories
$directories = ['storage/logs', 'storage/framework/cache', 'storage/framework/sessions', 'storage/framework/views', 'bootstrap/cache'];
foreach ($directories as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    if (is_writable($dir)) {
        $steps[] = ['success', "✓ Directory writable: $dir"];
    } else {
        chmod($dir, 0775);
        $steps[] = ['warning', "⚠ Set permissions for: $dir"];
    }
}

// Step 4: Check if vendor exists
if (is_dir('vendor') && file_exists('vendor/autoload.php')) {
    $steps[] = ['success', "✓ Composer dependencies installed"];
    
    // Load Laravel
    require 'vendor/autoload.php';
    $app = require_once 'bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();
    
    // Step 5: Check APP_KEY
    $appKey = env('APP_KEY');
    if (empty($appKey) || $appKey === 'base64:') {
        try {
            Artisan::call('key:generate', ['--force' => true]);
            $steps[] = ['success', "✓ Application key generated"];
        } catch (Exception $e) {
            $steps[] = ['error', "✗ Failed to generate key: " . $e->getMessage()];
        }
    } else {
        $steps[] = ['success', "✓ Application key exists"];
    }
    
    // Step 6: Test database connection
    try {
        DB::connection()->getPdo();
        $steps[] = ['success', "✓ Database connection successful"];
        
        // Step 7: Run migrations
        if (isset($_GET['migrate'])) {
            try {
                Artisan::call('migrate', ['--force' => true]);
                $output = Artisan::output();
                $steps[] = ['success', "✓ Migrations completed"];
                if ($output) {
                    $steps[] = ['info', "<pre>" . htmlspecialchars($output) . "</pre>"];
                }
            } catch (Exception $e) {
                $steps[] = ['error', "✗ Migration failed: " . $e->getMessage()];
            }
        }
        
        // Step 8: Run seeders
        if (isset($_GET['seed'])) {
            try {
                Artisan::call('db:seed', ['--class' => 'RoleSeeder', '--force' => true]);
                $output = Artisan::output();
                $steps[] = ['success', "✓ Database seeded (RoleSeeder)"];
                $steps[] = ['info', "Default admin: admin@digitmonie.com / password123"];
            } catch (Exception $e) {
                $steps[] = ['error', "✗ Seeding failed: " . $e->getMessage()];
            }
        }
        
        // Step 9: Create storage link
        if (isset($_GET['storage'])) {
            try {
                // Manual symlink since artisan command may fail
                $target = realpath('storage/app/public');
                $link = 'public/storage';
                
                if (!file_exists($link)) {
                    if (symlink($target, $link)) {
                        $steps[] = ['success', "✓ Storage link created"];
                    } else {
                        $steps[] = ['warning', "⚠ Could not create storage link - create manually"];
                    }
                } else {
                    $steps[] = ['success', "✓ Storage link already exists"];
                }
            } catch (Exception $e) {
                $steps[] = ['error', "✗ Storage link failed: " . $e->getMessage()];
            }
        }
        
        // Step 10: Cache config
        if (isset($_GET['cache'])) {
            try {
                Artisan::call('config:cache');
                Artisan::call('route:cache');
                Artisan::call('view:cache');
                $steps[] = ['success', "✓ Configuration cached"];
            } catch (Exception $e) {
                $steps[] = ['error', "✗ Cache failed: " . $e->getMessage()];
            }
        }
        
    } catch (Exception $e) {
        $steps[] = ['error', "✗ Database connection failed: " . $e->getMessage()];
        $steps[] = ['warning', "Please check your .env file database credentials:<br><pre>DB_CONNECTION=mysql\nDB_HOST=localhost\nDB_PORT=3306\nDB_DATABASE=your_database\nDB_USERNAME=your_username\nDB_PASSWORD=your_password</pre>"];
    }
    
} else {
    $steps[] = ['error', "✗ Composer dependencies not installed"];
    $steps[] = ['warning', "Please run 'composer install' or upload the vendor folder"];
}

// Display steps
foreach ($steps as $step) {
    echo "<div class='step {$step[0]}'>{$step[1]}</div>";
}

echo "</div>";

// Action buttons
echo "<div class='card'>";
echo "<h2>Setup Actions</h2>";
echo "<p>Click each button in order:</p>";
echo "<a href='?migrate' class='btn'>1. Run Migrations</a> ";
echo "<a href='?seed' class='btn'>2. Seed Database</a> ";
echo "<a href='?storage' class='btn'>3. Create Storage Link</a> ";
echo "<a href='?cache' class='btn'>4. Cache Config</a> ";
echo "<br><br>";
echo "<a href='?' class='btn' style='background:#64748b'>Refresh Status</a>";
echo "</div>";

// Warning
echo "<div class='card' style='border: 2px solid #dc2626;'>";
echo "<h2 style='color:#dc2626'>⚠️ Security Warning</h2>";
echo "<p><strong>DELETE THIS FILE</strong> after setup is complete!</p>";
echo "<p>This file should not remain on your production server.</p>";
echo "</div>";

echo "</body></html>";
?>
