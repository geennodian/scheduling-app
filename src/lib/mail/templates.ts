interface BookingEmailData {
  personName: string
  companyName?: string
  date: string
  startTime: string
  endTime: string
  timezone: string
  pageTitle: string
  organizerName?: string
  note?: string
  cancelUrl?: string
}

export function bookingConfirmationEmail(data: BookingEmailData): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>予約が確定しました</h2>
      <p>${data.personName} 様</p>
      <p>以下の内容で予約が確定しました。</p>

      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>件名:</strong> ${data.pageTitle}</p>
        ${data.organizerName ? `<p><strong>主催者:</strong> ${data.organizerName}</p>` : ''}
        <p><strong>日時:</strong> ${data.date} ${data.startTime} 〜 ${data.endTime} (${data.timezone})</p>
        ${data.companyName ? `<p><strong>会社名:</strong> ${data.companyName}</p>` : ''}
        <p><strong>お名前:</strong> ${data.personName}</p>
        ${data.note ? `<p><strong>備考:</strong> ${data.note}</p>` : ''}
      </div>

      ${data.cancelUrl ? `<p><a href="${data.cancelUrl}" style="color: #dc2626;">予約をキャンセルする</a></p>` : ''}
    </div>
  `
}

export function bookingNotificationEmail(data: BookingEmailData & { email: string; phone?: string }): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>新しい予約が入りました</h2>

      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>調整ページ:</strong> ${data.pageTitle}</p>
        <p><strong>日時:</strong> ${data.date} ${data.startTime} 〜 ${data.endTime} (${data.timezone})</p>
        <hr style="border: none; border-top: 1px solid #ddd;" />
        <p><strong>予約者:</strong> ${data.personName}</p>
        ${data.companyName ? `<p><strong>会社名:</strong> ${data.companyName}</p>` : ''}
        <p><strong>メール:</strong> ${data.email}</p>
        ${data.phone ? `<p><strong>電話:</strong> ${data.phone}</p>` : ''}
        ${data.note ? `<p><strong>備考:</strong> ${data.note}</p>` : ''}
      </div>
    </div>
  `
}
