<?php

namespace App\Notifications;

use App\Mail\GenericEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminAlertNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $title;
    protected $message;
    protected $actionUrl;

    /**
     * Create a new notification instance.
     */
    public function __construct($title, $message, $actionUrl = null)
    {
        $this->title = $title;
        $this->message = $message;
        $this->actionUrl = $actionUrl;
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
        $subject = "Admin Alert: " . $this->title;
        $body = "Admin Notification,\n\n{$this->message}";
        
        $ctaText = $this->actionUrl ? "View Details" : null;
        $ctaUrl = $this->actionUrl ? config('app.frontend_url') . $this->actionUrl : null;

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
            'title' => $this->title,
            'message' => $this->message,
            'action_url' => $this->actionUrl,
            'type' => 'admin_alert',
        ];
    }
}
