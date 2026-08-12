<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome', [
        'stats' => [
            'farms' => \App\Models\Farm::count(),
            'crops' => \App\Models\Crop::count(),
            'health_checks' => \App\Models\CropHealth::count(),
            'price_updates' => \App\Models\CropPrice::count(),
        ],
    ]);
})->name('dashboard');

Route::get('/health', fn () => response()->json(['status' => 'ok', 'app' => 'AgriSmart']))->name('health');
