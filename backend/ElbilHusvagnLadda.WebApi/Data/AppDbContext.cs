using ElbilHusvagnLadda.WebApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ElbilHusvagnLadda.WebApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<ChargingPoint> ChargingPoints { get; set; }
    public DbSet<ChargePointComment> ChargePointComments { get; set; }
    public DbSet<Feedback> Feedbacks { get; set; }
    public DbSet<SuggestedChargingPoint> SuggestedChargingPoints { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure ChargePointComment
        modelBuilder.Entity<ChargePointComment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Comment).IsRequired();
            entity.Property(e => e.Vote).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();

            // Configure relationship
            entity.HasOne(e => e.ChargingPoint)
                .WithMany()
                .HasForeignKey(e => e.ChargePointId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Seed data from the frontend
        modelBuilder.Entity<ChargingPoint>().HasData(
            new ChargingPoint
            {
                Id = 1,
                Title = "Vattenfall InCharge, M2 Center",
                Address1 = "Vattenfall - M2 Center",
                Address2 = "",
                PostalCode = "553 03",
                City = "Jönköping",
                Country = "Sweden",
                Comments = "An unknown places are dedicated for large vehicles",
                MapCoordinates = "57.7617016947237, 14.19194294601759",
                NumberOfChargePoints = 12,
                Capacity = 150
            },
            new ChargingPoint
            {
                Id = 2,
                Title = "IONITY, Mellerud",
                Address1 = "Snickargatan",
                Address2 = "",
                PostalCode = "464 30",
                City = "Mellerud",
                Country = "Sweden",
                Comments = "No dedicated spots, but works in many cases.",
                MapCoordinates = "58.7058060636534, 12.454113738931984",
                NumberOfChargePoints = 6,
                Capacity = 350
            },
            new ChargingPoint
            {
                Id = 3,
                Title = "Circle K Truck",
                Address1 = "Nyponvägen 3",
                Address2 = "",
                PostalCode = "341 32",
                City = "Ljungby",
                Country = "Sweden",
                Comments = "Seem to be large charge points, but not confirmed.",
                MapCoordinates = "56.81218919027184, 13.909877973820073",
                NumberOfChargePoints = null,
                Capacity = 300
            },
            new ChargingPoint
            {
                Id = 4,
                Title = "OKQ8",
                Address1 = "Norra vägen 1",
                Address2 = "",
                PostalCode = "546 34",
                City = "Karlsborg",
                Country = "Sweden",
                Comments = "Unknown number of charging points and placement.",
                MapCoordinates = "58.544494784622344, 14.502399970551915",
                NumberOfChargePoints = null,
                Capacity = 150
            },
            new ChargingPoint
            {
                Id = 5,
                Title = "Allego charging station",
                Address1 = "Ulvarydsvägen 2",
                Address2 = "",
                PostalCode = "285 35",
                City = "Markaryd",
                Country = "Sweden",
                Comments = "",
                MapCoordinates = "56.44481279040068, 13.60326467913148",
                NumberOfChargePoints = 8,
                Capacity = 300
            },
            new ChargingPoint
            {
                Id = 6,
                Title = "Rifil E.ON",
                Address1 = "Verkstadsgatan 3B",
                Address2 = "",
                PostalCode = "284 34",
                City = "Perstorp",
                Country = "Sweden",
                Comments = "Toilett and coffe machine(s).",
                MapCoordinates = "56.13384948475831, 13.388062564117424",
                NumberOfChargePoints = 8,
                Capacity = 240
            },
            new ChargingPoint
            {
                Id = 7,
                Title = "Quickcharge",
                Address1 = "Stridslyckegatan 4",
                Address2 = "",
                PostalCode = "595 35",
                City = "Mjölby",
                Country = "Sweden",
                Comments = "",
                MapCoordinates = "58.322298745345044, 15.092630394912435",
                NumberOfChargePoints = 6,
                Capacity = 300
            },
            new ChargingPoint
            {
                Id = 8,
                Title = "Circle K/Ingo",
                Address1 = "Storgatan 46",
                Address2 = "",
                PostalCode = "933 33",
                City = "Arvidsjaur",
                Country = "Sweden",
                Comments = "",
                MapCoordinates = "65.58818018806531, 19.19007382489225",
                NumberOfChargePoints = 2,
                Capacity = 360
            },
            new ChargingPoint
            {
                Id = 9,
                Title = "Circle K",
                Address1 = "Parkgatan 1",
                Address2 = "",
                PostalCode = "982 31",
                City = "Gällivare",
                Country = "Sweden",
                Comments = "",
                MapCoordinates = "67.13804586955752, 20.65923215302954",
                NumberOfChargePoints = 4,
                Capacity = 360
            }
        );
    }
}
