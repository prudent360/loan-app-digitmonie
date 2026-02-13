<?php

namespace App\Notifications;

use App\Mail\GenericEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class KycStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $status;
    protected $message;

    /**
     * Create a new notification instance.
     */
    public function __construct($status, $message)
    {
        $this->status = $status;
        $this->message = $message;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): GenericEmail
    {
        $subject = "KYC Verification Update: " . ucfirst($this->status);
        $body = "Dear {$notifiable->name},\n\n{$this->message}";
        
        $ctaText = "Go to Profile";
        $ctaUrl = config('app.frontend_url') . "/customer/profile";

        return (new GenericEmail($subject, $body, $ctaText, $ctaUrl))->to($notifiable->email);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'status' => $this->status,
            'message' => $this->message,
            'type' => 'kyc_update',
        ];
    }
}
