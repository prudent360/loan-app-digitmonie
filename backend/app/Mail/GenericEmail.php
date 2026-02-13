<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class GenericEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $templateSubject;
    public $templateBody;
    public $ctaText;
    public $ctaUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(string $subject, string $body, string $ctaText = null, string $ctaUrl = null)
    {
        $this->templateSubject = $subject;
        $this->templateBody = $body;
        $this->ctaText = $ctaText;
        $this->ctaUrl = $ctaUrl;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->templateSubject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            htmlString: $this->buildHtml(),
        );
    }

    /**
     * Build the HTML email content
     */
    protected function buildHtml(): string
    {
        $body = nl2br(e($this->templateBody));
        $ctaHtml = '';
        
        if ($this->ctaText && $this->ctaUrl) {
            $ctaHtml = <<<HTML
            <div style="text-align: center; margin: 30px 0;">
                <a href="{$this->ctaUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                    {$this->ctaText}
                </a>
            </div>
HTML;
        }
        
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$this->templateSubject}</title>
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f9fafb; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f9fafb; padding-bottom: 40px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #1e3a8a; padding: 32px; text-align: center; }
        .content { padding: 40px; }
        .footer { padding: 32px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6; }
        h1 { color: #ffffff; margin: 0; font-size: 24px; }
        p { margin-bottom: 16px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Digitmonie Loan</h1>
            </div>
            <div class="content">
                {$body}
                {$ctaHtml}
            </div>
            <div class="footer">
                <p>&copy; {{ date('Y') }} Digitmonie Loan. All rights reserved.</p>
                <p>Ensuring your financial growth with ease.</p>
            </div>
        </div>
    </div>
</body>
</html>
HTML;
    }
}
