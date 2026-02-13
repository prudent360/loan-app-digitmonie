<?php

namespace App\Mail;

use App\Models\EmailTemplate;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class TemplateEmail extends Mailable
{
    use SerializesModels;

    public $templateName;
    public $data;
    public $renderedSubject;
    public $renderedBody;

    /**
     * Create a new message instance.
     */
    public function __construct(string $templateName, array $data)
    {
        $this->templateName = $templateName;
        $this->data = $data;

        $template = EmailTemplate::getByName($templateName);
        
        if ($template) {
            $rendered = $template->render($data);
            $this->renderedSubject = $rendered['subject'];
            $this->renderedBody = $rendered['body'];
        } else {
            Log::error("Email template not found: {$templateName}");
            // Fallback for debugging
            $this->renderedSubject = "Notification";
            $this->renderedBody = "A notification was sent but the template '{$templateName}' was not found.";
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->renderedSubject,
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
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$this->renderedSubject}</title>
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f9fafb; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f9fafb; padding-bottom: 40px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #1e3a8a; padding: 32px; text-align: center; }
        .content { padding: 40px; }
        .footer { padding: 32px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6; }
        h1 { color: #ffffff; margin: 0; font-size: 24px; }
        p { margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        table td { padding: 10px; border-bottom: 1px solid #eee; }
        .btn { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Digitmonie Loan</h1>
            </div>
            <div class="content">
                {$this->renderedBody}
            </div>
            <div class="footer">
                <p>&copy; 2026 Digitmonie Loan. All rights reserved.</p>
                <p>Ensuring your financial growth with ease.</p>
            </div>
        </div>
    </div>
</body>
</html>
HTML;
    }
}
