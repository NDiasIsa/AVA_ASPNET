using AVA_ASPNET.Data;
using AVA_ASPNET.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AVA_ASPNET.Controllers
{
    public class HomeController : Controller
    {
        private readonly AppDbContext _db;

        public HomeController(AppDbContext db)
        {
            _db = db;
        }

        public async Task<IActionResult> Index()
        {
            var noticias = await _db.Noticias
                .Where(n => n.Publicada)
                .OrderByDescending(n => n.DataPublicacao)
                .ToListAsync();

            var viewModel = new HomeViewModel
            {
                Destaques = noticias.Where(n => n.Destaque).ToList(),
                Cards = noticias.Where(n => n.Card).ToList()
            };

            return View(viewModel);
        }

        public async Task<IActionResult> Noticia(int id)
        {
            var noticia = await _db.Noticias
                .Include(n => n.Autor)
                .FirstOrDefaultAsync(n => n.Id == id && n.Publicada);

            if (noticia == null) return NotFound();

            return View(noticia);
        }

        public IActionResult Error() => View();
    }
}
