import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Project } from '../types';

export async function exportToPDF(project: Project) {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1920, 1080],
  });

  for (let i = 0; i < project.slides.length; i++) {
    const slide = project.slides[i];
    
    // Create a temporary div to render the slide
    const slideDiv = document.createElement('div');
    slideDiv.style.width = '1920px';
    slideDiv.style.height = '1080px';
    slideDiv.style.backgroundColor = slide.backgroundColor;
    slideDiv.style.color = slide.textColor;
    slideDiv.style.display = 'flex';
    slideDiv.style.alignItems = 'center';
    slideDiv.style.justifyContent = 'center';
    slideDiv.style.padding = '80px';
    slideDiv.style.boxSizing = 'border-box';
    slideDiv.style.position = 'absolute';
    slideDiv.style.left = '-9999px';
    slideDiv.style.fontFamily = 'Arial, sans-serif';

    // Render content based on template
    if (slide.template === 'title') {
      slideDiv.innerHTML = `<h1 style="font-size: 96px; text-align: center; margin: 0;">${slide.title}</h1>`;
    } else if (slide.template === 'title-content') {
      slideDiv.innerHTML = `
        <div style="width: 100%;">
          <h2 style="font-size: 72px; margin-bottom: 40px;">${slide.title}</h2>
          <p style="font-size: 48px; line-height: 1.6;">${slide.content}</p>
        </div>
      `;
    } else if (slide.template === 'two-column') {
      slideDiv.innerHTML = `
        <div style="width: 100%;">
          <h2 style="font-size: 72px; margin-bottom: 40px;">${slide.title}</h2>
          <div style="font-size: 48px; line-height: 1.6;">${slide.content}</div>
        </div>
      `;
    } else if (slide.template === 'image-text') {
      slideDiv.innerHTML = `
        <div style="display: flex; gap: 60px; align-items: center; width: 100%;">
          <div style="flex: 1; border: 4px solid; border-color: ${slide.textColor}; height: 600px; display: flex; align-items: center; justify-content: center; font-size: 96px;">📷</div>
          <div style="flex: 1;">
            <h2 style="font-size: 72px; margin-bottom: 40px;">${slide.title}</h2>
            <p style="font-size: 48px; line-height: 1.6;">${slide.content}</p>
          </div>
        </div>
      `;
    } else {
      slideDiv.innerHTML = `<p style="font-size: 48px; line-height: 1.6; text-align: center;">${slide.content}</p>`;
    }

    document.body.appendChild(slideDiv);

    try {
      const canvas = await html2canvas(slideDiv, {
        width: 1920,
        height: 1080,
        scale: 1,
        backgroundColor: slide.backgroundColor,
      });

      const imgData = canvas.toDataURL('image/png');
      
      if (i > 0) {
        pdf.addPage();
      }
      
      pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
    } finally {
      document.body.removeChild(slideDiv);
    }
  }

  pdf.save(`${project.name}.pdf`);
}

