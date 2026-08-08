namespace AVA_ASPNET.Services
{
    public static class FileValidationService
    {
        private static readonly Dictionary<string, byte[]> MagicNumbers = new()
        {
            { ".pdf",  new byte[] { 0x25, 0x50, 0x44, 0x46 } },           // %PDF
            { ".png",  new byte[] { 0x89, 0x50, 0x4E, 0x47 } },           // PNG
            { ".jpg",  new byte[] { 0xFF, 0xD8, 0xFF } },                  // JPEG
            { ".jpeg", new byte[] { 0xFF, 0xD8, 0xFF } },                  // JPEG
            { ".gif",  new byte[] { 0x47, 0x49, 0x46, 0x38 } },           // GIF
            { ".docx", new byte[] { 0x50, 0x4B, 0x03, 0x04 } },           // ZIP/DOCX
            { ".xlsx", new byte[] { 0x50, 0x4B, 0x03, 0x04 } },           // ZIP/XLSX
            { ".pptx", new byte[] { 0x50, 0x4B, 0x03, 0x04 } },           // ZIP/PPTX
            { ".mp4",  new byte[] { 0x00, 0x00, 0x00 } },                  // MP4
            { ".zip",  new byte[] { 0x50, 0x4B, 0x03, 0x04 } },           // ZIP
        };

        public static bool ValidarArquivo(IFormFile arquivo)
        {
            var extensao = Path.GetExtension(arquivo.FileName).ToLower();

            // Se extensão não está na lista, permite (não bloqueia tipos desconhecidos)
            if (!MagicNumbers.ContainsKey(extensao)) return true;

            var magicEsperado = MagicNumbers[extensao];
            var buffer = new byte[magicEsperado.Length];

            using var stream = arquivo.OpenReadStream();
            stream.Read(buffer, 0, buffer.Length);

            return buffer.Take(magicEsperado.Length)
                         .SequenceEqual(magicEsperado);

        }

    }

}

