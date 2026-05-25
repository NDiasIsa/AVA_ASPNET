using AVA_ASPNET.Models;
using Microsoft.AspNetCore.Mvc;

namespace AVA_ASPNET.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            var viewModel = new HomeViewModel
            {
                Destaques = new List<Noticia>
                {
                    new() { Id = 1, Assunto = "assunto", Titulo = "Lorem ipsum dolor sit amet.", ImagemUrl = "/imagens/img-exemplo.png", Link = "#" },
                    new() { Id = 2, Assunto = "assunto", Titulo = "Lorem ipsum dolor sit amet consectetur adipisicing elit.", ImagemUrl = "/imagens/img-exemplo2.png", Link = "#" },
                    new() { Id = 3, Assunto = "assunto", Titulo = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse.", ImagemUrl = "/imagens/img-exemplo3.png", Link = "#" },
                    new() { Id = 4, Assunto = "assunto", Titulo = "Lorem ipsum dolor sit amet consectetur.", ImagemUrl = "/imagens/img-exemplo4.png", Link = "#" },
                    new() { Id = 5, Assunto = "assunto", Titulo = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Numquam, magni.", ImagemUrl = "/imagens/img-exemplo5.png", Link = "#" },
                },
                Noticias = new List<Noticia>
                {
                    new() { Id = 1, Assunto = "assunto", Titulo = "Lorem ipsum dolor sit amet.", Descricao = "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dicta vero minima aperiam, repellat sed, provident nisi ipsam quaerat, enim neque excepturi.", ImagemUrl = "/imagens/img-exemplo.png", Link = "#" },
                    new() { Id = 2, Assunto = "assunto", Titulo = "Lorem ipsum dolor sit amet consectetur adipisicing.", Descricao = "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Modi est ipsum repellendus quidem ducimus. Impedit nulla quia doloremque.", ImagemUrl = "/imagens/img-exemplo2.png", Link = "#" },
                    new() { Id = 3, Assunto = "assunto", Titulo = "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Eaque, neque!", Descricao = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quam dolorem nobis atque? Voluptatem, repellendus repellat!", ImagemUrl = "/imagens/img-exemplo5.png", Link = "#" },
                }
            };

            return View(viewModel);
        }

        public IActionResult Error() => View();
    }
}
