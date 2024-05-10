export class ClickReplyOption {
  click_trans_id: number;
  merchant_trans_id: string;
  merchant_prepare_id: number;
  error: number;
  error_note: string;

  constructor(
    click_trans_id: number,
    merchant_trans_id: string,
    merchant_prepare_id: number,
    error: number,
    error_note: string,
  ) {
    this.click_trans_id = click_trans_id;
    this.merchant_trans_id = merchant_trans_id;
    this.merchant_prepare_id = merchant_prepare_id;
    this.error = error;
    this.error_note = error_note;
  }

  getReplyObject() {
    return {
      click_trans_id: this.click_trans_id,
      merchant_trans_id: this.merchant_trans_id,
      merchant_prepare_id: this.merchant_prepare_id,
      error: this.error,
      error_note: this.error_note,
    };
  }
}
