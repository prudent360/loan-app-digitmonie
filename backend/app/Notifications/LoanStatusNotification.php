<?php

namespace App\Notifications;

use App\Mail\GenericEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LoanStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $loan;
    protected $status;
    protected $message;

    /**
     * Create a new notification instance.
     */
    public function __construct($loan, $status, $message)
    {
        $this->loan = $loan;
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
        $subject = "Loan Update: " . ucfirst($this->status);
        $body = "Dear {$notifiable->name},\n\n{$this->message}\n\nLoan Amount: ₦" . number_format($this->loan->amount, 2) . "\nLoan ID: #LN-" . str_pad($this->loan->id, 6, '0', STR_PAD_LEFT);
        
        $ctaText = "View Loan Details";
        $ctaUrl = config('app.frontend_url') . "/customer/loans/" . $this->loan->id;

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
            'loan_id' => $this->loan->id,
            'status' => $this->status,
            'message' => $this->message,
            'amount' => $this->loan->amount,
            'type' => 'loan_update',
        ];
    }
}
