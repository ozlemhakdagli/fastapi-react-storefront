<br><br><br><br>
<?php if(! $this->session->userdata('uye_oturum')){
		$this->session->set_flashdata('mesaj','Giriş Yapmadınız');
		redirect(base_url().'MusteriLogin');} ?>
					<div class="left-sidebar">
				<div class="col-sm-2">
					
						
						<div class="panel-group category-products" id="accordian"><!--category-productsr-->
							<div class="panel panel-default">
								<div class="panel-heading">
									<h4 class="panel-title">
										<a data-toggle="collapse" data-parent="#accordian" href="#sportswear">
											<span class="badge pull-right"><i class="fa fa-plus"></i></span>
											<h2>Üyelik İşlemleri</h2>
										</a>
									</h4>
								</div>
								<div id="sportswear" class="panel-collapse collapse">
									<div class="panel-body">
										<ul>
											<li><a href="<?=base_url()?>home/uyepanel/">Üyelik Bilgilerim </a></li>
											<li><a href="<?=base_url()?>home/mesajlarim/">Gönderilmiş Mesajlarım</a></li>
											<li><a href="<?=base_url()?>home/g_mesajlarim">Gelen Mesajlarım</a></li>
											<li><a href="<?=base_url()?>home/siparislerim/">Siparişlerim</a></li>
											<li><a href="<?=base_url()?>home/sepetim/">Sepetim</a></li>
											<li><a href="<?=base_url()?>home/yorumlarim/">Yorumlarım</a></li>
											<li><a href="<?=base_url()?>musteriLogin/log_out">Çıkış</a></li>
										</ul>
									</div>
								</div>
							</div>
						-
				</div></div></div>