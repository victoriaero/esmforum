const bd = require('../bd/bd_utils.js');
const modelo = require('../modelo.js');

beforeEach(() => {
  if (typeof modelo.reconfig_bd === 'function') {
    modelo.reconfig_bd(bd);
  }
  bd.reconfig('./bd/esmforum-teste.db');
  bd.exec('delete from respostas', []);
  bd.exec('delete from perguntas', []);
});

test('Testando banco de dados vazio', () => {
  expect(modelo.listar_perguntas().length).toBe(0);
});

test('Testando cadastro de três perguntas', () => {
  modelo.cadastrar_pergunta('1 + 1 = ?');
  modelo.cadastrar_pergunta('2 + 2 = ?');
  modelo.cadastrar_pergunta('3 + 3 = ?');

  const perguntas = modelo.listar_perguntas();
  expect(perguntas.length).toBe(3);
  expect(perguntas[0].texto).toBe('1 + 1 = ?');
  expect(perguntas[1].texto).toBe('2 + 2 = ?');
  expect(perguntas[2].num_respostas).toBe(0);
  expect(perguntas[1].id_pergunta).toBe(perguntas[2].id_pergunta - 1);
});

test('Cadastro de respostas e get_respostas()', () => {
  const idPerg = modelo.cadastrar_pergunta('Qual a cor do céu?');
  const idR1 = modelo.cadastrar_resposta(idPerg, 'Azul');
  const idR2 = modelo.cadastrar_resposta(idPerg, 'Depende da hora');

  expect(idR2).toBe(idR1 + 1);

  const respostas = modelo.get_respostas(idPerg);
  expect(respostas).toHaveLength(2);
  expect(respostas.map(r => r.texto)).toEqual(['Azul', 'Depende da hora']);
});

test('Detalhe da pergunta e contador de respostas', () => {
  const idPerg = modelo.cadastrar_pergunta('5 × 5 = ?');

  expect(modelo.get_pergunta(idPerg).texto).toBe('5 × 5 = ?');
  expect(modelo.get_num_respostas(idPerg)).toBe(0);

  modelo.cadastrar_resposta(idPerg, '25');
  expect(modelo.get_num_respostas(idPerg)).toBe(1);
});

test('Lista de perguntas traz num_respostas correto para cada linha', () => {
  const id1 = modelo.cadastrar_pergunta('Primeira?');
  const id2 = modelo.cadastrar_pergunta('Segunda?');

  modelo.cadastrar_resposta(id2, 'Resposta única');

  const lista = modelo.listar_perguntas();
  const p1 = lista.find(p => p.id_pergunta === id1);
  const p2 = lista.find(p => p.id_pergunta === id2);

  expect(p1.num_respostas).toBe(0);
  expect(p2.num_respostas).toBe(1);
});

test('reconfig_bd() permite injetar mock de BD', () => {
  const mockBd = {
    queryAll : jest.fn().mockReturnValue([{ id_pergunta: 99, texto: 'stub', id_usuario: 42 }]),
    query: jest.fn(),
    exec: jest.fn(),
    reconfig: jest.fn(),
  };

  modelo.reconfig_bd(mockBd);
  const perguntas = modelo.listar_perguntas();

  expect(mockBd.queryAll).toHaveBeenCalledTimes(1);
  expect(perguntas[0].texto).toBe('stub');

  modelo.reconfig_bd(bd);
});