/**
 * Gera o hash bcrypt da sua senha para usar como ADMIN_PASS_HASH no Railway.
 *
 * Uso:
 *   node scripts/gerar-hash-senha.js SUA_SENHA_AQUI
 *
 * Cole o resultado como variável ADMIN_PASS_HASH no Railway.
 */
const bcrypt = require('bcryptjs')

const password = process.argv[2]

if (!password || password.length < 8) {
  console.error('\nErro: informe uma senha com pelo menos 8 caracteres.')
  console.error('Uso: node scripts/gerar-hash-senha.js SUA_SENHA_AQUI\n')
  process.exit(1)
}

console.log('\nGerando hash (pode levar alguns segundos)...')
const hash = bcrypt.hashSync(password, 12)

console.log('\n✓ Hash gerado com sucesso!')
console.log('\nCole no Railway como variável ADMIN_PASS_HASH:')
console.log('\n' + hash + '\n')
