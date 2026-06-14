import openpyxl
import json
import urllib.request
import urllib.error
from datetime import datetime

# Configurações do Supabase
SUPABASE_URL = "https://wwrgcgdfwhimbftdkeii.supabase.co"
SERVICE_ROLE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3"
    "cmdjZ2Rmd2hpbWJmdGRrZWlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MD"
    "g0OTA3NSwiZXhwIjoyMDk2NDI1MDc1fQ.jmcWKQgQi4PB0Or2U5IZQad51XD_Vmkt-tXXGFabors"
)

# Configurações do Excel
EXCEL_PATH = r"C:\IEQParaiso\importe\cad_membros.xlsx"

# ID do cargo "Membro"
CARGO_MEMBRO_ID = "acd88437-f94f-408e-9573-0b45dd73f84d"

def fetch_existing_members():
    print("Consultando membros existentes no banco de dados...")
    url = f"{SUPABASE_URL}/rest/v1/membros?select=nome_completo,codigo_ieq"
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            print(f"Encontrados {len(data)} membros cadastrados.")
            return data
    except urllib.error.URLError as e:
        print("Erro ao consultar membros existentes:", e)
        return []

def run_import():
    # 1. Carregar membros existentes do banco
    existing_members = fetch_existing_members()
    
    # Criar caches para busca rápida
    existing_names = set()
    existing_codes = set()
    
    for m in existing_members:
        if m.get("nome_completo"):
            existing_names.add(m["nome_completo"].strip().upper())
        if m.get("codigo_ieq") is not None:
            existing_codes.add(int(m["codigo_ieq"]))

    # 2. Carregar arquivo Excel
    print(f"Lendo planilha de membros: {EXCEL_PATH}...")
    try:
        wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
        sheet = wb.active
        rows = list(sheet.iter_rows(values_only=True))
    except Exception as e:
        print("Erro ao carregar arquivo Excel:", e)
        return

    if not rows:
        print("Planilha vazia.")
        return

    # Verificar cabeçalhos
    header = rows[0]
    print("Cabeçalhos detectados:", header)
    
    # Mapear posições
    # Espera-se: 'cod ieq' e 'nome_completo'
    try:
        idx_cod = header.index('cod ieq')
        idx_nome = header.index('nome_completo')
    except ValueError:
        # Tentar fallback caso os nomes variem um pouco
        idx_cod = 0
        idx_nome = 1
        print("Aviso: Cabeçalhos exatos não encontrados. Usando coluna 0 para Código e coluna 1 para Nome.")

    # 3. Processar linhas
    payloads = []
    skipped_dup_db = 0
    skipped_dup_sheet = 0
    skipped_invalid = 0
    
    today_str = datetime.utcnow().date().isoformat()
    
    for r_idx, r in enumerate(rows[1:], start=2):
        raw_cod = r[idx_cod]
        raw_nome = r[idx_nome]
        
        if not raw_nome:
            skipped_invalid += 1
            continue
            
        nome_upper = str(raw_nome).strip().upper()
        
        # Validar e limpar Código IEQ
        cod_ieq = None
        if raw_cod is not None:
            raw_cod_str = str(raw_cod).strip()
            if raw_cod_str != '-' and raw_cod_str != '':
                try:
                    cod_ieq = int(float(raw_cod_str))
                except ValueError:
                    pass

        # Verificar duplicados no banco
        is_dup = False
        if nome_upper in existing_names:
            is_dup = True
        elif cod_ieq is not None and cod_ieq in existing_codes:
            is_dup = True
            
        if is_dup:
            skipped_dup_db += 1
            continue

        # Evitar duplicados na própria planilha
        if nome_upper in [p["nome_completo"] for p in payloads]:
            skipped_dup_sheet += 1
            continue
        if cod_ieq is not None and cod_ieq in [p["codigo_ieq"] for p in payloads if p["codigo_ieq"] is not None]:
            skipped_dup_sheet += 1
            continue

        # Adicionar ao payload
        payloads.append({
            "nome_completo": nome_upper,
            "telefone": None,
            "whatsapp": None,
            "endereco": None,
            "cidade": "ARAGUARI",
            "uf": "MG",
            "data_nascimento": None,
            "estado_civil": None,
            "data_batismo": None,
            "data_ingresso": today_str,
            "foto_url": None,
            "observacoes": "IMPORTADO VIA PLANILHA EXCEL",
            "ativo": True,
            "cargo_id": CARGO_MEMBRO_ID,
            "codigo_ieq": cod_ieq
        })

    total_records = len(rows) - 1
    print("\nResumo do processamento do Excel:")
    print(f"- Total de registros no Excel: {total_records}")
    print(f"- Inválidos (sem nome): {skipped_invalid}")
    print(f"- Duplicados já no banco: {skipped_dup_db}")
    print(f"- Duplicados na própria planilha: {skipped_dup_sheet}")
    print(f"- Novos registros a importar: {len(payloads)}")

    if not payloads:
        print("Nenhum novo registro para importar.")
        return

    # 4. Importar dados em lotes (batches) de 50
    batch_size = 50
    print(f"\nIniciando envio em lotes de {batch_size} registros...")
    
    url = f"{SUPABASE_URL}/rest/v1/membros"
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    imported_count = 0
    for i in range(0, len(payloads), batch_size):
        batch = payloads[i:i + batch_size]
        print(f"Importando lote {i // batch_size + 1} ({len(batch)} registros)...")
        
        req_body = json.dumps(batch).encode('utf-8')
        req = urllib.request.Request(url, data=req_body, headers=headers, method="POST")
        
        try:
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                imported_count += len(result)
                print(f"Lote importado com sucesso. Status code: {response.status}")
        except urllib.error.HTTPError as e:
            print(f"Erro ao enviar lote: {e.code} - {e.reason}")
            try:
                error_body = e.read().decode('utf-8')
                print("Detalhes do erro do banco:", error_body)
            except Exception:
                pass
            return
        except urllib.error.URLError as e:
            print("Erro de conexão na importação:", e)
            return

    print(f"\nImportação concluída! {imported_count} membros adicionados ao banco com sucesso.")

if __name__ == "__main__":
    run_import()
