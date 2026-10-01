import CertificateData
set_option maxRecDepth 100000
set_option maxHeartbeats 0
namespace Pinwheel.Certificate
theorem checked_t4023 : checkTree 35 cert t4023 = true := by decide +kernel
end Pinwheel.Certificate
