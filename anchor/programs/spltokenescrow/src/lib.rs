use anchor_lang::prelude::*;

declare_id!("u4AZsQHiYE5wZcHkaoW6WKkypg7uTXVQuok3Ka9ghci");

pub mod instructions;
pub use instructions::*;

pub mod state;
pub use state::*;

#[program]
pub mod spltokenescrow {
    use super::*;

    pub fn make(
        ctx: Context<Make>,
        seed: u64,
        receive_amount: u64,
        deposit_amount: u64,
    ) -> Result<()> {
        ctx.accounts
            .init_escrow_state(seed, receive_amount, ctx.bumps)?;
        ctx.accounts.deposit(deposit_amount)?;
        Ok(())
    }

    pub fn take(ctx: Context<Take>) -> Result<()> {
        ctx.accounts.withdraw()?;
        Ok(())
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        ctx.accounts.refund()?;
        Ok(())
    }
}
