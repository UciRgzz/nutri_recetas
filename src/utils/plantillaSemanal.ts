import type { Patient, MacroDistribution, Meal } from '../types';

async function imgToDataUrl(src: string): Promise<string> {
  const res = await fetch(src);
  const blob = await res.blob();
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export async function abrirPlantillaSemanal(
  logoSrc: string,
  get: number,
  patient: Patient,
  macros: MacroDistribution,
  meals: Meal[]
) {
  const logoDataUrl = await imgToDataUrl(logoSrc);
  const grHC   = Math.round((get * macros.hdec / 100) / 4);
  const grProt = Math.round((get * macros.prot / 100) / 4);
  const grLip  = Math.round((get * macros.lip  / 100) / 9);
  const fecha  = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  const nombreArchivo = `menu-semanal-${patient.nombre.replace(/\s+/g, '-').toLowerCase() || 'paciente'}`;

  const DIAS = ['DOMINGO','LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO'];
  const COLS = [
    { label: 'DESAYUNO', hora: '9:00 AM',   key: 'Desayuno'    },
    { label: 'SNACK',    hora: '11:30 AM',  key: 'Medio día'   },
    { label: 'COMIDA',   hora: '2:00 PM',   key: 'Comida'      },
    { label: 'SNACK',    hora: '5:00 PM',   key: 'Media tarde' },
    { label: 'CENA',     hora: '8:30 PM',   key: 'Cena'        },
  ];

  const cellContent = (mealKey: string): string => {
    const meal = meals.find(m => m.nombre === mealKey);
    if (!meal || meal.preparaciones.length === 0) return '';
    return meal.preparaciones.map(prep => {
      const ings = prep.ingredientes
        .filter(i => i.nombre.trim())
        .map(i => `<span class="ing">• ${i.nombre}${i.gramos > 0 ? ` (${i.gramos}g)` : ''}</span>`)
        .join('');
      return `<span class="ptitle">${prep.nombre}</span>${ings}`;
    }).join('<br>');
  };

  const colHeaders = COLS.map(c =>
    `<th class="ch"><div class="ch-name">${c.label}</div><div class="ch-hora" contenteditable="true" spellcheck="false">${c.hora}</div></th>`
  ).join('');

  const tableRows = (dias: string[]) => dias.map(dia => {
    const cells = COLS.map(col =>
      `<td class="mc" contenteditable="true" spellcheck="false">${cellContent(col.key)}</td>`
    ).join('');
    return `<tr><td class="dc">${dia}</td>${cells}</tr>`;
  }).join('');

  const pageMarkup = (dias: string[]) => `
<div class="page">
  <div class="header">
    <div class="logo-col"><img src="${logoDataUrl}" alt="Lic Nutrición"/></div>
    <div class="title-center">
      <div class="title-menu">MENÚ SEMANAL</div>
      <div class="title-divider"></div>
      <div class="title-sub">Plan nutricional personalizado</div>
    </div>
    <div class="semana-box">
      <span class="semana-lbl">SEMANA No:</span>
      <div class="semana-num" contenteditable="true" spellcheck="false">1</div>
    </div>
  </div>
  <div class="infobar">
    <div class="tag">Paciente: <span class="editable" contenteditable="true" spellcheck="false">${patient.nombre || '—'}</span></div>
    <span class="dot"></span>
    <div class="tag">GET: <span class="editable" contenteditable="true" spellcheck="false">${get || '—'} kcal</span></div>
    <span class="dot"></span>
    <div class="tag">HC: <span class="editable" contenteditable="true" spellcheck="false">${grHC}g (${macros.hdec}%)</span></div>
    <span class="dot"></span>
    <div class="tag">Prot: <span class="editable" contenteditable="true" spellcheck="false">${grProt}g (${macros.prot}%)</span></div>
    <span class="dot"></span>
    <div class="tag">Lip: <span class="editable" contenteditable="true" spellcheck="false">${grLip}g (${macros.lip}%)</span></div>
  </div>
  <div class="menu-wrap">
    <table class="menu-table">
      <thead>
        <tr>
          <th class="th-empty">DÍA</th>
          ${colHeaders}
        </tr>
      </thead>
      <tbody>
        ${tableRows(dias)}
      </tbody>
    </table>
  </div>
  <div class="footer">
    <span>Lic. Nutrición · Daniela Martínez Rodríguez</span>
    <span>Generado el ${fecha} · Todas las celdas son editables</span>
    <span>¡Cuida tu salud cada día!</span>
  </div>
</div>`;

  
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Menú Semanal – ${patient.nombre || 'Paciente'}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<style>
*{box-sizing:border-box;}
html, body{margin:0;padding:0;background:#ffffff;}
body{font-family:'Segoe UI',Arial,sans-serif;min-height:100vh;}
.weekly-document{width:1122px;}
.page{width:1000px;height:700px;background:white;border-radius:0;overflow:hidden;box-shadow:none;position:relative;margin:0;page-break-after:always;break-after:page;}
.page:last-child{page-break-after:auto;break-after:auto;}
.header{display:grid;grid-template-columns:70px 1fr 90px;align-items:center;padding:6px 20px 4px;background:linear-gradient(135deg,#f5fbf2 0%,#ffffff 55%,#f0f8ec 100%);border-bottom:2px solid #4a7c3f;gap:12px;}
.logo-col{display:flex;align-items:center;justify-content:center;}
.logo-col img{width:56px;height:56px;object-fit:contain;mix-blend-mode:multiply;}
.title-center{text-align:center;}
.title-menu{font-size:18px;font-weight:900;letter-spacing:3px;color:#1e3d0f;text-transform:uppercase;line-height:1.1;}
.title-divider{width:44px;height:2px;background:linear-gradient(90deg,transparent,#4a7c3f,transparent);margin:3px auto;}
.title-sub{font-size:8px;font-weight:400;letter-spacing:4px;color:#7aab64;text-transform:uppercase;}
.semana-box{text-align:center;border-left:1.5px solid #cce8c0;padding-left:12px;}
.semana-lbl{font-size:7px;font-weight:700;letter-spacing:1px;color:#7aab64;text-transform:uppercase;display:block;margin-bottom:2px;}
.semana-num{font-size:22px;font-weight:900;color:#4a7c3f;line-height:1;display:inline-block;border-bottom:2px solid #4a7c3f;padding-bottom:1px;min-width:36px;}
.infobar{background:linear-gradient(90deg,#2d5a1e,#3d7029,#4a7c3f);padding:3px 20px;display:flex;gap:14px;font-size:9px;color:rgba(255,255,255,.92);letter-spacing:.3px;flex-wrap:wrap;align-items:center;}
.infobar .tag{display:flex;align-items:center;gap:4px;}
.infobar .dot{width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,.35);}
.editable{display:inline-block;min-width:10px;font-weight:800;color:white;cursor:text;border-radius:3px;padding:0 2px;}
.editable:hover{background:rgba(255,255,255,0.15);}
.editable:focus{background:rgba(255,255,255,0.2);outline:1px dashed rgba(255,255,255,0.5);}
[contenteditable]{-webkit-user-modify:read-write;cursor:text;}
@page{ size:A4 landscape; margin:4mm; }
.menu-wrap{}
.menu-table{width:100%;border-collapse:collapse;table-layout:fixed;}
.th-empty{background:#f4f8f2;border:1px solid #deebd8;width:84px;font-weight:900;font-size:9px;text-align:center;color:#1e3d0f;}
.ch{background:linear-gradient(180deg,#4a7c3f,#2d5a1e);color:white;text-align:center;padding:4px 4px;border:1px solid #3a6b2f;vertical-align:middle;}
.ch-name{font-size:8px;font-weight:800;letter-spacing:0.6px;text-transform:uppercase;}
.ch-hora{font-size:6.6px;font-weight:400;opacity:.8;margin-top:1px;letter-spacing:.2px;}
.dc{background:linear-gradient(180deg,#e6f4e0,#d4eccc);color:#1e3d0f;font-weight:900;font-size:9px;letter-spacing:.4px;text-align:center;padding:4px 2px;border:1px solid #b8d8a8;vertical-align:middle;width:84px;white-space:nowrap;}
.mc{border:1px solid #ddeedd;padding:4px 6px;font-size:7.5px;color:#2c2c2c;vertical-align:top;background:white;height:122px;line-height:1.12;cursor:text;overflow:hidden;}
tbody tr{page-break-inside:avoid;break-inside:avoid;}
tr:nth-child(even) .mc{background:#f8fdf6;}
.mc:hover{background:#f0faea;outline:1.5px dashed #4a7c3f;}
.mc:focus{background:#edf8e6;outline:2px solid #4a7c3f;}
.ptitle{display:block;font-weight:700;color:#2d5a1e;font-size:8px;margin-bottom:2px;line-height:1.12;}
.ing{display:block;color:#444;font-size:7px;line-height:1.12;}
.footer{background:linear-gradient(90deg,#f0f8ec,#e4f2dc);padding:4px 24px;display:flex;justify-content:space-between;align-items:center;font-size:7.5px;color:#3d7029;border-top:2px solid #a0ce8a;font-weight:500;}
#btn-dl{position:fixed;bottom:22px;right:22px;background:linear-gradient(135deg,#3d7029,#4a7c3f);color:white;border:none;border-radius:14px;padding:13px 28px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(45,90,30,.4);display:flex;align-items:center;gap:8px;z-index:9999;transition:transform .2s,box-shadow .2s;}
#btn-dl:hover{transform:translateY(-2px);box-shadow:0 8px 26px rgba(45,90,30,.55);}
@media print{body{background:white;padding:0;}#btn-dl{display:none!important;}.page{box-shadow:none;border-radius:0;}}
</style>
</head>
<body>
<div class="weekly-document">
  ${pageMarkup(DIAS.slice(0, 4))}
  ${pageMarkup(DIAS.slice(4))}
</div>
<button id="btn-dl" onclick="descargar()">⬇ Descargar PDF</button>
<script>
function descargar(){
  var btn=document.getElementById('btn-dl');
  btn.style.display='none';
  setTimeout(function(){
    html2pdf().set({
      margin:[1,1,1,1],
      filename:'${nombreArchivo}.pdf',
      image:{type:'jpeg',quality:1.0},
      html2canvas:{
        scale:2.6,
        useCORS:true,
        logging:false,
        backgroundColor:'#ffffff',
        windowWidth:1000,
        scrollX:0,
        scrollY:0,
        onclone:function(doc){
          doc.documentElement.style.cssText='margin:0;padding:0;background:#ffffff;';
          doc.body.style.cssText='margin:0;padding:0;background:white;display:block;';
          var pages=doc.querySelectorAll('.page');
          pages.forEach(function(p){p.style.cssText='width:1000px;height:700px;max-width:1000px;overflow:hidden;box-shadow:none;border-radius:0;margin:0 auto;page-break-after:always;';});
        }
      },
      pagebreak:{mode:['css'],avoid:['.page','tr']},
      jsPDF:{unit:'mm',format:'a4',orientation:'landscape'}
    }).from(document.querySelector('.weekly-document')).save()
    .then(function(){btn.style.display='flex';});
  },400);
}
</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}