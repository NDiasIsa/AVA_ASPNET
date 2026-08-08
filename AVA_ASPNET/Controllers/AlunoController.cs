using AVA_ASPNET.Data;
using AVA_ASPNET.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AVA_ASPNET.Controllers
{
    [Authorize(Roles = "Aluno")]
    public class AlunoController : Controller
    {
        private readonly AppDbContext _db;
        private readonly UserManager<IdentityUser> _userManager;

        public AlunoController(AppDbContext db, UserManager<IdentityUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        public async Task<IActionResult> MinhaTurma()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return RedirectToAction("Login", "Account");

            var perfil = await _db.Perfis
                .FirstOrDefaultAsync(p => p.UserId == user.Id);

            if (perfil?.TurmaId == null)
            {
                TempData["Erro"] = "Você ainda não está associado a nenhuma turma.";
                return RedirectToAction("Index", "Home");
            }

            return RedirectToAction("Index", "Turma", new { turmaId = perfil.TurmaId });
        }
    }
}