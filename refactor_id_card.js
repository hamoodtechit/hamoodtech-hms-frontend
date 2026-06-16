const fs = require('fs');
const file = '/media/data/hospitalmanagment/src/components/shared/id-card-dialog.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the patientFront block (between {/* Patient Front */} and <div className="page-break"></div>)
const pfStart = content.indexOf("{/* Patient Front */}");
const pfEnd = content.indexOf('<div className="page-break"></div>', pfStart);
const patientFrontCode = content.substring(pfStart + 21, pfEnd).trim();

// Find the patientBack block
const pbStart = content.indexOf("{/* Patient Back */}");
const pbEnd = content.indexOf('</>', pbStart);
const patientBackCode = content.substring(pbStart + 20, pbEnd).trim();

// Find the staffFront block
const sfStart = content.indexOf("{/* Staff Front */}");
const sfEnd = content.indexOf('<div className="page-break"></div>', sfStart);
const staffFrontCode = content.substring(sfStart + 19, sfEnd).trim();

// Find the staffBack block
const sbStart = content.indexOf("{/* Staff Back */}");
const sbEnd = content.indexOf('</>', sbStart);
const staffBackCode = content.substring(sbStart + 18, sbEnd).trim();

// We will inject variables before the return statement.
const variables = `
  const patientFront = (
    ${patientFrontCode}
  )

  const patientBack = (
    ${patientBackCode}
  )

  const staffFront = (
    ${staffFrontCode}
  )

  const staffBack = (
    ${staffBackCode}
  )
`;

// Replace the return statement
content = content.replace("  return (\n    <Dialog", variables + "\n  return (\n    <Dialog");

// Replace the print container contents
content = content.replace(/<div id="id-card-print-content" className="hidden">([\s\S]*?)<\/div>\s*\{\/\* Visual Display for User \*\/\}/, `<div id="id-card-print-content" className="hidden">
            {type === 'patient' ? (
              <>
                {patientFront}
                <div className="page-break"></div>
                {patientBack}
              </>
            ) : (
              <>
                {staffFront}
                <div className="page-break"></div>
                {staffBack}
              </>
            )}
          </div>

          {/* Visual Display for User */}`);

// Replace the visual display contents
content = content.replace(/\{\/\* Visual Display for User \*\/\}[\s\S]*<\/DialogContent>/, `{/* Visual Display for User */}
          <div className="flex gap-8 justify-center overflow-x-auto w-full max-w-[800px]">
             {type === 'patient' ? (
              <>
                <div className="shrink-0 flex flex-col gap-2 items-center">
                  <span className="text-sm font-medium text-muted-foreground">Front Side</span>
                  <div className="shadow-xl overflow-hidden rounded-md relative flex flex-col">{patientFront}</div>
                </div>
                <div className="shrink-0 flex flex-col gap-2 items-center">
                  <span className="text-sm font-medium text-muted-foreground">Back Side</span>
                  <div className="shadow-xl overflow-hidden rounded-md relative flex flex-col">{patientBack}</div>
                </div>
              </>
             ) : (
              <>
                <div className="shrink-0 flex flex-col gap-2 items-center">
                  <span className="text-sm font-medium text-muted-foreground">Front Side</span>
                  <div className="shadow-xl overflow-hidden rounded-md relative flex flex-col">{staffFront}</div>
                </div>
                <div className="shrink-0 flex flex-col gap-2 items-center">
                  <span className="text-sm font-medium text-muted-foreground">Back Side</span>
                  <div className="shadow-xl overflow-hidden rounded-md relative flex flex-col">{staffBack}</div>
                </div>
              </>
             )}
          </div>
        </div>
      </DialogContent>`);

fs.writeFileSync(file, content);
console.log("Refactoring complete");
