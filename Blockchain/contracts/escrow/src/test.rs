use super::*;
use soroban_sdk::{
    testutils::{Address as _},
    Env,
};

fn create_token_contract<'a>(
    env: &Env,
    admin: &Address,
) -> (token::Client<'a>, token::StellarAssetClient<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let address = sac.address();
    (
        token::Client::new(env, &address),
        token::StellarAssetClient::new(env, &address),
    )
}

#[allow(dead_code)]
struct TestSetup<'a> {
    env: Env,
    contract: EscrowContractClient<'a>,
    buyer: Address,
    seller: Address,
    arbiter: Address,
    token: token::Client<'a>,
    token_admin: token::StellarAssetClient<'a>,
}

fn setup<'a>() -> TestSetup<'a> {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let arbiter = Address::generate(&env);

    let (token, token_admin) = create_token_contract(&env, &admin);
    token_admin.mint(&buyer, &1_000_000);

    let contract_id = env.register_contract(None, EscrowContract);
    let contract = EscrowContractClient::new(&env, &contract_id);

    TestSetup {
        env,
        contract,
        buyer,
        seller,
        arbiter,
        token,
        token_admin,
    }
}

#[test]
fn full_happy_path_release() {
    let s = setup();
    let escrow_id = 1u64;

    s.contract
        .create_escrow(&escrow_id, &s.buyer, &s.seller, &s.arbiter, &s.token.address, &500);
    s.contract.fund(&escrow_id);

    assert_eq!(s.token.balance(&s.buyer), 1_000_000 - 500);
    assert_eq!(s.token.balance(&s.contract.address), 500);

    s.contract.release(&escrow_id, &s.buyer);

    assert_eq!(s.token.balance(&s.seller), 500);
    assert_eq!(s.token.balance(&s.contract.address), 0);

    let escrow = s.contract.get_escrow(&escrow_id);
    assert_eq!(escrow.status, EscrowStatus::Released);
}

#[test]
fn dispute_resolved_in_buyers_favor_refunds() {
    let s = setup();
    let escrow_id = 2u64;

    s.contract
        .create_escrow(&escrow_id, &s.buyer, &s.seller, &s.arbiter, &s.token.address, &250);
    s.contract.fund(&escrow_id);
    s.contract.dispute(&escrow_id, &s.buyer);
    s.contract.resolve(&escrow_id, &false);

    assert_eq!(s.token.balance(&s.buyer), 1_000_000);
    let escrow = s.contract.get_escrow(&escrow_id);
    assert_eq!(escrow.status, EscrowStatus::Refunded);
}

#[test]
fn seller_can_voluntarily_refund() {
    let s = setup();
    let escrow_id = 3u64;

    s.contract
        .create_escrow(&escrow_id, &s.buyer, &s.seller, &s.arbiter, &s.token.address, &100);
    s.contract.fund(&escrow_id);
    s.contract.refund(&escrow_id, &s.seller);

    let escrow = s.contract.get_escrow(&escrow_id);
    assert_eq!(escrow.status, EscrowStatus::Refunded);
}

#[test]
fn release_before_funding_fails() {
    let s = setup();
    let escrow_id = 4u64;

    s.contract
        .create_escrow(&escrow_id, &s.buyer, &s.seller, &s.arbiter, &s.token.address, &100);

    let result = s.contract.try_release(&escrow_id, &s.buyer);
    assert_eq!(result, Err(Ok(Error::InvalidStatus)));
}

#[test]
fn duplicate_escrow_id_fails() {
    let s = setup();
    let escrow_id = 5u64;

    s.contract
        .create_escrow(&escrow_id, &s.buyer, &s.seller, &s.arbiter, &s.token.address, &100);

    let result = s.contract.try_create_escrow(
        &escrow_id,
        &s.buyer,
        &s.seller,
        &s.arbiter,
        &s.token.address,
        &100,
    );
    assert_eq!(result, Err(Ok(Error::AlreadyExists)));
}

#[test]
fn unrelated_address_cannot_release() {
    let s = setup();
    let escrow_id = 6u64;
    let stranger = Address::generate(&s.env);

    s.contract
        .create_escrow(&escrow_id, &s.buyer, &s.seller, &s.arbiter, &s.token.address, &100);
    s.contract.fund(&escrow_id);

    let result = s.contract.try_release(&escrow_id, &stranger);
    assert_eq!(result, Err(Ok(Error::Unauthorized)));
}

#[test]
fn arbiter_can_resolve_in_sellers_favor() {
    let s = setup();
    let escrow_id = 7u64;

    s.contract
        .create_escrow(&escrow_id, &s.buyer, &s.seller, &s.arbiter, &s.token.address, &300);
    s.contract.fund(&escrow_id);
    s.contract.dispute(&escrow_id, &s.seller);
    s.contract.resolve(&escrow_id, &true);

    assert_eq!(s.token.balance(&s.seller), 300);
    let escrow = s.contract.get_escrow(&escrow_id);
    assert_eq!(escrow.status, EscrowStatus::Released);
}

#[test]
fn resolving_a_non_disputed_escrow_fails() {
    let s = setup();
    let escrow_id = 8u64;

    s.contract
        .create_escrow(&escrow_id, &s.buyer, &s.seller, &s.arbiter, &s.token.address, &100);
    s.contract.fund(&escrow_id);

    // Never disputed — still Funded, not Disputed.
    let result = s.contract.try_resolve(&escrow_id, &true);
    assert_eq!(result, Err(Ok(Error::InvalidStatus)));
}

#[test]
fn unrelated_address_cannot_open_a_dispute() {
    let s = setup();
    let escrow_id = 9u64;
    let stranger = Address::generate(&s.env);

    s.contract
        .create_escrow(&escrow_id, &s.buyer, &s.seller, &s.arbiter, &s.token.address, &100);
    s.contract.fund(&escrow_id);

    let result = s.contract.try_dispute(&escrow_id, &stranger);
    assert_eq!(result, Err(Ok(Error::Unauthorized)));
}

#[test]
fn disputing_before_funding_fails() {
    let s = setup();
    let escrow_id = 10u64;

    s.contract
        .create_escrow(&escrow_id, &s.buyer, &s.seller, &s.arbiter, &s.token.address, &100);

    // Still Created, never funded.
    let result = s.contract.try_dispute(&escrow_id, &s.buyer);
    assert_eq!(result, Err(Ok(Error::InvalidStatus)));
}

#[test]
fn releasing_twice_fails_the_second_time() {
    let s = setup();
    let escrow_id = 11u64;

    s.contract
        .create_escrow(&escrow_id, &s.buyer, &s.seller, &s.arbiter, &s.token.address, &100);
    s.contract.fund(&escrow_id);
    s.contract.release(&escrow_id, &s.buyer);

    // Already Released — a second release must not pay out again.
    let result = s.contract.try_release(&escrow_id, &s.buyer);
    assert_eq!(result, Err(Ok(Error::InvalidStatus)));
    assert_eq!(s.token.balance(&s.seller), 100);
}

#[test]
fn zero_amount_is_rejected() {
    let s = setup();
    let escrow_id = 12u64;

    let result = s
        .contract
        .try_create_escrow(&escrow_id, &s.buyer, &s.seller, &s.arbiter, &s.token.address, &0);
    assert_eq!(result, Err(Ok(Error::InvalidAmount)));
}

#[test]
fn negative_amount_is_rejected() {
    let s = setup();
    let escrow_id = 13u64;

    let result = s.contract.try_create_escrow(
        &escrow_id,
        &s.buyer,
        &s.seller,
        &s.arbiter,
        &s.token.address,
        &-50,
    );
    assert_eq!(result, Err(Ok(Error::InvalidAmount)));
}

#[test]
fn get_escrow_on_an_unknown_id_fails_with_not_found() {
    let s = setup();

    // Verified against the real deployed testnet contract too (see
    // Blockchain/README.md / BlockchainService.getOnChainEscrow) — this
    // is the exact error the Backend distinguishes "not registered
    // on-chain yet" from every other failure mode on.
    let result = s.contract.try_get_escrow(&999u64);
    assert_eq!(result, Err(Ok(Error::NotFound)));
}

#[test]
fn print_sample_escrow_xdr_for_client_fixture() {
    use soroban_sdk::{xdr::{Limits, WriteXdr}, IntoVal, TryFromVal, Val};

    let env = Env::default();
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let arbiter = Address::generate(&env);
    let token = Address::generate(&env);

    let escrow = Escrow {
        buyer: buyer.clone(),
        seller: seller.clone(),
        arbiter: arbiter.clone(),
        token: token.clone(),
        amount: 500_000_000i128,
        status: EscrowStatus::Disputed,
    };

    let val: Val = escrow.into_val(&env);
    let scval = soroban_sdk::xdr::ScVal::try_from_val(&env, &val).unwrap();
    let b64 = scval.to_xdr_base64(Limits::none()).unwrap();

    std::println!("FIXTURE_ESCROW_XDR_B64={b64}");
    std::println!("FIXTURE_BUYER={:?}", buyer);
    std::println!("FIXTURE_SELLER={:?}", seller);
    std::println!("FIXTURE_ARBITER={:?}", arbiter);
    std::println!("FIXTURE_TOKEN={:?}", token);

    let status_val: Val = EscrowStatus::Funded.into_val(&env);
    let status_scval = soroban_sdk::xdr::ScVal::try_from_val(&env, &status_val).unwrap();
    std::println!(
        "FIXTURE_STATUS_FUNDED_XDR_B64={}",
        status_scval.to_xdr_base64(Limits::none()).unwrap()
    );
}
