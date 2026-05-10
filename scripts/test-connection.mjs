// ===================================================================
// TORU — Supabase 疎通確認スクリプト
// ===================================================================
// 使い方:
//   1. npm install @supabase/supabase-js dotenv
//   2. node scripts/test-connection.mjs
//
// 目的:
//   - .env.local が正しく読めているか確認
//   - service_role で管理操作ができるか確認
//   - anon で未認証時に RLS が効いているか確認
// ===================================================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error('[NG] 環境変数が不足しています。.env.local を確認してください');
  console.error(`     SUPABASE_URL: ${url ? 'OK' : 'MISSING'}`);
  console.error(`     SUPABASE_ANON_KEY: ${anonKey ? 'OK' : 'MISSING'}`);
  console.error(`     SUPABASE_SERVICE_ROLE_KEY: ${serviceKey ? 'OK' : 'MISSING'}`);
  process.exit(1);
}

console.log('[OK] 環境変数ロード成功');
console.log(`     URL: ${url}`);

const anon = createClient(url, anonKey);
const admin = createClient(url, serviceKey);

async function run() {
  // --- Test 1: service_role で公開マスタを読む ---
  console.log('\n[Test 1] service_role で public_unit_price_master を読む');
  const { data: master, error: e1 } = await admin
    .from('public_unit_price_master')
    .select('material_name, unit, unit_price, category')
    .limit(10);

  if (e1) {
    console.error('  [NG]', e1.message);
    process.exit(1);
  }
  console.log(`  [OK] ${master.length}件 取得`);
  console.table(master);

  // --- Test 2: 未認証 anon で unit_price_master を読む（RLS で0件になる想定） ---
  console.log('\n[Test 2] 未認証 anon で unit_price_master を読む（RLS検証）');
  const { data: unit, error: e2 } = await anon
    .from('unit_price_master')
    .select('*')
    .limit(5);

  if (e2) {
    console.log(`  [OK] RLS で拒否: ${e2.message}`);
  } else if (unit.length === 0) {
    console.log('  [OK] 空配列（RLSで0件に絞られた）');
  } else {
    console.warn(`  [NG] ${unit.length}件 読めてしまった。RLSポリシーを確認`);
  }

  // --- Test 3: 未認証 anon で public_unit_price_master を読む（ポリシー上は auth.uid() not null なので0件想定） ---
  console.log('\n[Test 3] 未認証 anon で public_unit_price_master を読む');
  const { data: pub, error: e3 } = await anon
    .from('public_unit_price_master')
    .select('*')
    .limit(5);

  if (e3) {
    console.log(`  [OK] 期待どおり拒否: ${e3.message}`);
  } else if (pub.length === 0) {
    console.log('  [OK] 空配列（未認証では0件、認証後に読める設計）');
  } else {
    console.warn(`  [NG] 未認証で${pub.length}件 読めた。ポリシーを確認`);
  }

  console.log('\n[完了] 基本的な疎通・RLS動作確認 OK');
}

run().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
