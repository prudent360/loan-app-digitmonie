<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    protected $fillable = ['name', 'display_name', 'description'];

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }

    public function givePermission(string $permission): void
    {
        $perm = Permission::where('name', $permission)->first();
        if ($perm && !$this->permissions->contains($perm)) {
            $this->permissions()->attach($perm);
        }
    }

    public function revokePermission(string $permission): void
    {
        $perm = Permission::where('name', $permission)->first();
        if ($perm) {
            $this->permissions()->detach($perm);
        }
    }

    public function hasPermission(string $permission): bool
    {
        return $this->permissions->contains('name', $permission);
    }
}
