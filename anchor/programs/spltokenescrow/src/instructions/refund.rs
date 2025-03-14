use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{close_account, transfer_checked, CloseAccount, TransferChecked},
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::EscrowState;

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    pub mint_a: Box<InterfaceAccount<'info, Mint>>,
    pub mint_b: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
    )]
    pub maker_mint_a_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        seeds=[b"escrow", escrow.maker.key().as_ref(), escrow.seed.to_le_bytes().as_ref()],
        has_one=maker,
        has_one=mint_a,
        has_one=mint_b,
        bump=escrow.bump,
        close=maker,
    )]
    pub escrow: Box<Account<'info, EscrowState>>,

    #[account(
        mut,
        associated_token::mint=mint_a,
        associated_token::authority=escrow,
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> Refund<'info> {
    pub fn refund(&mut self) -> Result<()> {
        let seeds = &[
            b"escrow",
            self.maker.to_account_info().key.as_ref(),
            &self.escrow.seed.to_le_bytes()[..],
            &[self.escrow.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Transfer tokens back from vault to maker.
        let accounts = TransferChecked {
            from: self.vault.to_account_info(),
            to: self.maker_mint_a_ata.to_account_info(),
            mint: self.mint_a.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let cpi_context = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts,
            signer_seeds,
        );

        transfer_checked(cpi_context, self.vault.amount, self.mint_a.decimals)?;

        // Close the vault.
        let accounts = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.maker.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let cpi_context = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts,
            signer_seeds,
        );

        close_account(cpi_context)?;
        Ok(())
    }
}
