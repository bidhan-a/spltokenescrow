#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

#[program]
pub mod spltokenescrow {
    use super::*;

  pub fn close(_ctx: Context<CloseSpltokenescrow>) -> Result<()> {
    Ok(())
  }

  pub fn decrement(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.spltokenescrow.count = ctx.accounts.spltokenescrow.count.checked_sub(1).unwrap();
    Ok(())
  }

  pub fn increment(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.spltokenescrow.count = ctx.accounts.spltokenescrow.count.checked_add(1).unwrap();
    Ok(())
  }

  pub fn initialize(_ctx: Context<InitializeSpltokenescrow>) -> Result<()> {
    Ok(())
  }

  pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
    ctx.accounts.spltokenescrow.count = value.clone();
    Ok(())
  }
}

#[derive(Accounts)]
pub struct InitializeSpltokenescrow<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  init,
  space = 8 + Spltokenescrow::INIT_SPACE,
  payer = payer
  )]
  pub spltokenescrow: Account<'info, Spltokenescrow>,
  pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseSpltokenescrow<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  mut,
  close = payer, // close account and return lamports to payer
  )]
  pub spltokenescrow: Account<'info, Spltokenescrow>,
}

#[derive(Accounts)]
pub struct Update<'info> {
  #[account(mut)]
  pub spltokenescrow: Account<'info, Spltokenescrow>,
}

#[account]
#[derive(InitSpace)]
pub struct Spltokenescrow {
  count: u8,
}
