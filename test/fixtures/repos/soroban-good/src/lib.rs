#![no_std]
use soroban_sdk::contract;

#[contract]
pub struct TokenContract;

#[cfg(test)]
mod test;
