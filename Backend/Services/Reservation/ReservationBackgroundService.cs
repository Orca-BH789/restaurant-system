using Restaurant_Management.Services.Reservation;

namespace Restaurant_Management.Services.Reservation
{
    /// <summary>
    /// Background service ?? t? ??ng:
    /// 1. Cancel các reservation quá 15 phút ch?a ??n
    /// 2. G?i email nh?c nh? tr??c 1 gi?
    /// Ch?y trong background, không block request
    /// </summary>
    public class ReservationBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ReservationBackgroundService> _logger;
        private Timer? _cancellationTimer;
        private Timer? _reminderTimer;

        public ReservationBackgroundService(IServiceProvider serviceProvider, ILogger<ReservationBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ReservationBackgroundService started");

            // Timer 1: Cancel overdue reservations m?i 5 phút
            _cancellationTimer = new Timer(
                async _ => await CancelOverdueReservations(),
                null,
                TimeSpan.FromMinutes(1), // Delay 1 phút khi start
                TimeSpan.FromMinutes(5)  // Ch?y m?i 5 phút
            );

            // Timer 2: Send reminder emails m?i 10 phút
            _reminderTimer = new Timer(
                async _ => await SendReminderEmails(),
                null,
                TimeSpan.FromMinutes(2), // Delay 2 phút khi start
                TimeSpan.FromMinutes(10) // Ch?y m?i 10 phút
            );

            return Task.CompletedTask;
        }

        private async Task CancelOverdueReservations()
        {
            try
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var reservationService = scope.ServiceProvider.GetRequiredService<IReservationService>();
                    await reservationService.CancelOverdueReservationsAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CancelOverdueReservations background job");
            }
        }

        private async Task SendReminderEmails()
        {
            try
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var reservationService = scope.ServiceProvider.GetRequiredService<IReservationService>();
                    await reservationService.SendReminderEmailsAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SendReminderEmails background job");
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("ReservationBackgroundService stopping");

            _cancellationTimer?.Dispose();
            _reminderTimer?.Dispose();

            await base.StopAsync(cancellationToken);
        }

        public override void Dispose()
        {
            _cancellationTimer?.Dispose();
            _reminderTimer?.Dispose();
            base.Dispose();
        }
    }
}
