import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function sendOrderConfirmationEmail(
  email: string,
  orderId: string,
  items: any[],
  total: number
) {
  if (!resend) {
    console.log('No RESEND_API_KEY found. Running local email delivery simulation:')
    console.log(`To: ${email}\nOrder: ${orderId}\nTotal: $${(total/100).toFixed(2)}\nItems:`, items)
    return
  }

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eaeaea;">${item.name} (x${item.quantity})</td>
      <td style="padding: 10px; border-bottom: 1px solid #eaeaea; text-align: right;">$${item.price.toLocaleString()}</td>
    </tr>
  `).join('')

  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Order Confirmation</h1>
      <p>Thank you for your purchase from VelloTech! Your order has been successfully processed.</p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin-top: 0; font-size: 18px;">Order Details</h2>
        <p><strong>Order Number:</strong> ${orderId}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd;">Item</th>
              <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding: 10px; font-weight: bold; text-align: right;">Total Paid</td>
              <td style="padding: 10px; font-weight: bold; text-align: right;">$${(total/100).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <p>We'll notify you once your order ships.</p>
      <p style="color: #666; font-size: 12px; margin-top: 40px;">© ${new Date().getFullYear()} VelloTech. All rights reserved.</p>
    </div>
  `

  try {
    const data = await resend.emails.send({
      from: 'VelloTech <orders@vellotech.store>',
      to: email,
      subject: `Order Confirmation - ${orderId}`,
      html: html,
    })
    console.log('Order confirmation email sent:', data)
  } catch (error) {
    console.error('Error sending order confirmation email:', error)
    throw new Error("ERR-VLT-MAIL-301")
  }
}
